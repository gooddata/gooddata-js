// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
import {
    isPlainObject,
    isFunction,
    set as _set,
    defaults,
    merge,
    result
} from 'lodash';

import { thisPackage } from './util';
import fetch from './utils/fetch';

/**
 * Ajax wrapper around GDC authentication mechanisms, SST and TT token handling and polling.
 * Inteface is same as original jQuery.ajax.

 * If token is expired, current request is "paused", token is refreshed and request is retried and result.
 * is transparently returned to original call.

 * Additionally polling is handled. Only final result of polling returned.
 * @module xhr
 * @class xhr
 */

const DEFAULT_POLL_DELAY = 1000;

function simulateBeforeSend(url, settings) {
    const xhrMockInBeforeSend = {
        setRequestHeader(key, value) {
            _set(settings, ['headers', key], value);
        }
    };

    if (isFunction(settings.beforeSend)) {
        settings.beforeSend(xhrMockInBeforeSend, url);
    }
}

function enrichSettingWithCustomDomain(originalUrl, originalSettings, domain) {
    let url = originalUrl;
    const settings = originalSettings;
    if (domain) {
        // protect url to be prepended with domain on retry
        if (originalUrl.indexOf(domain) === -1) {
            url = domain + originalUrl;
        }
        settings.mode = 'cors';
        settings.credentials = 'include';
    }

    return { url, settings };
}

export function handlePolling(url, settings, sendRequest) {
    const pollingDelay = result(settings, 'pollDelay');

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            sendRequest(url, settings).then(resolve, reject);
        }, pollingDelay);
    });
}

export const originPackageHeaders = ({ name, version }) => ({
    'X-GDC-JS-PKG': name,
    'X-GDC-JS-PKG-VERSION': version
});

export class ApiError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}

export class ApiResponseError extends ApiError {
    constructor(message, response, responseBody) {
        super(message, null);
        this.response = response;
        this.responseBody = responseBody;
    }
}

export class ApiNetworkError extends ApiError {}

export class ApiResponse {
    constructor(response, responseBody) {
        this.response = response;
        this.responseBody = responseBody;
    }

    get data() {
        try {
            return JSON.parse(this.responseBody);
        } catch (error) {
            return this.responseBody;
        }
    }

    getData() {
        try {
            return JSON.parse(this.responseBody);
        } catch (error) {
            return this.responseBody;
        }
    }
}

export function createModule(configStorage) {
    let tokenRequest; // TODO make app-wide persistent (ie. extract outside of the SDK)

    defaults(configStorage, { xhrSettings: {} });

    function createRequestSettings(customSettings) {
        const settings = merge(
            {
                headers: {
                    Accept: 'application/json; charset=utf-8',
                    'Content-Type': 'application/json',
                    ...originPackageHeaders(configStorage.originPackage || thisPackage)
                }
            },
            configStorage.xhrSettings,
            customSettings
        );

        settings.pollDelay = (settings.pollDelay !== undefined) ? settings.pollDelay : DEFAULT_POLL_DELAY;

        // TODO jquery compat - add to warnings
        settings.body = (settings.data) ? settings.data : settings.body;
        settings.mode = 'same-origin';
        settings.credentials = 'same-origin';

        if (isPlainObject(settings.body)) {
            settings.body = JSON.stringify(settings.body);
        }

        return settings;
    }

    /**
     * Back compatible method for setting common XHR settings
     *
     * Usually in our apps we used beforeSend ajax callback to set the X-GDC-REQUEST header with unique ID.
     *
     * @param settings object XHR settings as
     */
    function ajaxSetup(settings) {
        Object.assign(configStorage.xhrSettings, settings);
    }

    function continueAfterTokenRequest(url, settings) {
        return tokenRequest.then(async (response) => {
            if (!response.ok) {
                throw new ApiResponseError('Unauthorized', response, null);
            }
            tokenRequest = null;

            return ajax(url, settings); // eslint-disable-line no-use-before-define
        }, (reason) => {
            tokenRequest = null;
            return reason;
        });
    }

    async function handleUnauthorized(originalUrl, originalSettings) {
        // Create only single token request for any number of waiting request.
        // If token request exist, just listen for it's end.
        if (tokenRequest) {
            return continueAfterTokenRequest(originalUrl, originalSettings);
        }

        const { url, settings } = enrichSettingWithCustomDomain('/gdc/account/token', createRequestSettings({}), configStorage.domain);

        tokenRequest = fetch(url, settings);
        const response = await tokenRequest;
        const responseBody = await response.text();
        tokenRequest = null;
        // TODO jquery compat - allow to attach unauthorized callback and call it if attached
        // if ((xhrObj.status === 401) && (isFunction(req.unauthorized))) {
        //     req.unauthorized(xhrObj, textStatus, err, deferred);
        //     return;
        // }
        // unauthorized handler is not defined or not http 401
        // unauthorized when retrieving token -> not logged

        if (response.status === 401) {
            throw new ApiResponseError('Unauthorized', response, responseBody);
        }

        return new ApiResponse(response, responseBody);
    }

    async function ajax(originalUrl, customSettings = {}) {
        // TODO refactor to: getRequestParams(originalUrl, customSettings);
        const firstSettings = createRequestSettings(customSettings);
        const { url, settings } = enrichSettingWithCustomDomain(originalUrl, firstSettings, configStorage.domain);

        simulateBeforeSend(url, settings); // mutates `settings` param

        if (tokenRequest) {
            return continueAfterTokenRequest(url, settings);
        }

        let response;
        try {
            response = await fetch(url, settings);
        } catch (e) {
            throw new ApiNetworkError(e.message, e); // TODO is it really necessary? couldn't we throw just Error?
        }

        // Fetch URL and resolve body promise (if left unresolved, the body isn't even shown in chrome-dev-tools)
        const responseBody = await response.text();

        if (response.status === 401) {
            // if 401 is in login-request, it means wrong user/password (we wont continue)
            if (url.indexOf('/gdc/account/login') !== -1) {
                throw new ApiResponseError('Unauthorized', response, responseBody);
            }
            return handleUnauthorized(url, settings);
        }

        // Note: Fetch does redirects automagically for 301 (and maybe more .. TODO when?)
        // see https://fetch.spec.whatwg.org/#ref-for-concept-request%E2%91%A3%E2%91%A2
        if (response.status === 202 && !settings.dontPollOnResult) {
            // poll on new provided url, fallback to the original one
            // (for example validElements returns 303 first with new url which may then return 202 to poll on)
            let finalUrl = response.url || url;

            const finalSettings = settings;

            // if the response is 202 and Location header is not empty, let's poll on the new Location
            if (response.headers.has('Location')) {
                finalUrl = response.headers.get('Location');
            }
            finalSettings.method = 'GET';
            delete finalSettings.data;
            delete finalSettings.body;

            return handlePolling(finalUrl, finalSettings, ajax);
        }

        if (response.status >= 200 && response.status <= 399) {
            return new ApiResponse(response, responseBody);
        }

        // throws on 400, 500, etc.
        throw new ApiResponseError(response.statusText, response, responseBody);
    }

    function xhrMethod(method) {
        return function xhrMethodFn(url, settings) {
            const opts = merge({ method }, settings);
            return ajax(url, opts);
        };
    }

    /**
     * Wrapper for xhr.ajax method GET
     * @method get
     */
    const get = xhrMethod('GET');

    /**
     * Wrapper for xhr.ajax method POST
     * @method post
     */
    const post = xhrMethod('POST');

    /**
     * Wrapper for xhr.ajax method PUT
     * @method put
     */
    const put = xhrMethod('PUT');

    /**
     * Wrapper for xhr.ajax method DELETE
     * @method delete
     */
    const del = xhrMethod('DELETE');

    return {
        get,
        post,
        put,
        del,
        ajax,
        ajaxSetup
    };
}
