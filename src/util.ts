// (C) 2007-2020 GoodData Corporation
import get from "lodash/get";
import { delay } from "./utils/promise";
import { ApiResponse, ApiResponseError } from "./xhr";

import { name as pkgName, version as pkgVersion } from "../package.json";

/**
 * Utility methods. Mostly private
 *
 * @module util
 * @class util
 *
 */

/**
 * Gooddata-js package signature
 * @private
 */
export const thisPackage = { name: pkgName, version: pkgVersion };

/**
 * Create getter function for accessing nested objects
 *
 * @param {String} path Target path to nested object
 * @method getIn
 * @private
 */
export const getIn = (path: string) => (object: any) => get(object, path);

export interface IPollingOptions {
    attempts?: number;
    maxAttempts?: number;
    pollStep?: number;
}

/**
 * Helper for polling
 *
 * @param xhrRequest xhr module
 * @param {String} uri
 * @param {Function} isPollingDone
 * @param {Object} options for polling (maxAttempts, pollStep)
 * @private
 */
export const handlePolling = (
    xhrRequest: any,
    uri: string,
    isPollingDone: (response: any) => boolean,
    options: IPollingOptions = {},
) => {
    // TODO
    const { attempts = 0, maxAttempts = 50, pollStep = 5000 } = options;

    return xhrRequest(uri)
        .then((r: any) => r.getData())
        .then((response: any) => {
            if (attempts > maxAttempts) {
                return Promise.reject(new Error(response));
            }
            return isPollingDone(response)
                ? Promise.resolve(response)
                : delay(pollStep).then(() => {
                      return handlePolling(xhrRequest, uri, isPollingDone, {
                          ...options,
                          attempts: attempts + 1,
                      });
                  });
        });
};

/**
 * Helper for polling with header status
 *
 * @param xhrRequest xhr module
 * @param {String} uri
 * @param {Function} isPollingDone
 * @param {Object} options for polling (maxAttempts, pollStep)
 * @private
 */
export const handleHeadPolling = (
    xhrRequest: any,
    uri: string,
    isPollingDone: (responseHeaders: Response, response: ApiResponse) => boolean,
    options: IPollingOptions = {},
) => {
    const { attempts = 0, maxAttempts = 50, pollStep = 5000 } = options;

    return xhrRequest(uri).then((response: any) => {
        if (attempts > maxAttempts) {
            return Promise.reject(new Error("Export timeout!!!"));
        }
        const responseHeaders = response.getHeaders();
        if (isPollingDone(responseHeaders, response)) {
            if (responseHeaders.status === 200) {
                return Promise.resolve({ uri });
            }
            return Promise.reject(new ApiResponseError(response.statusText, response, response.getData()));
        } else {
            return delay(pollStep).then(() =>
                handleHeadPolling(xhrRequest, uri, isPollingDone, {
                    ...options,
                    attempts: attempts + 1,
                }),
            );
        }
    });
};

/**
 * Builds query string from plain object
 * (Refactored from admin/routes.js)
 *
 * @param {Object} query parameters possibly including arrays inside
 * @returns {string} querystring
 */
export function queryString(query: any) {
    function getSingleParam(key: string, value: string) {
        return Array.isArray(value)
            ? value.map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`).join("&")
            : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return query
        ? `?${Object.keys(query)
              .map(k => getSingleParam(k, query[k]))
              .join("&")}`
        : "";
}

/**
 * Get all results from paged api by traversing all resulting pages
 * This is usable for apis which support offset and limit (i.e. not those with next paging links)
 *
 * @param xhrGet xhr module
 * @param {string} uri uri to be fetched, will append offset and limit for next pages
 * @param {string} itemKey key under which to look for results (differs for different apis)
 * @param {number} optional offset starting offset, default 0
 * @param pagesData optional data to be pre-filled
 */
export function getAllPagesByOffsetLimit(
    xhr: any,
    uri: string,
    itemKey: string,
    offset: number = 0,
    pagesData: any[] = [],
) {
    const PAGE_LIMIT = 100;
    return new Promise((resolve: any, reject: any) => {
        xhr.get(`${uri}?offset=${offset}&limit=${PAGE_LIMIT}`)
            .then((r: any) => r.getData())
            .then((dataObjects: any[]) => {
                const projects = get(dataObjects, itemKey);
                const data = pagesData.concat(projects.items);

                const totalCount = get(projects, "paging.totalCount", 0);
                const nextPage = offset + PAGE_LIMIT;
                if (nextPage > totalCount) {
                    resolve(data);
                } else {
                    resolve(getAllPagesByOffsetLimit(xhr, uri, itemKey, nextPage, data));
                }
            }, reject);
    });
}

export function getUIDByDevice(): string {
    const navigatorInfo: Navigator = window.navigator;
    const screenInfo: Screen = window.screen;
    let uid: string = navigatorInfo.mimeTypes.length.toString();
    uid += navigatorInfo.userAgent.replace(/\D+/g, "");
    uid += navigatorInfo.plugins.length.toString();
    uid += screenInfo.height || "";
    uid += screenInfo.width || "";
    uid += screenInfo.pixelDepth || "";

    return uid;
}
