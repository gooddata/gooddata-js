// Copyright (C) 2007-2017, GoodData(R) Corporation. All rights reserved.
import defaultSdk, { factory } from '../src/gooddata';
import fetchMock from './utils/fetch-mock';

const modules = [
    'catalogue',
    'config',
    'md',
    'project',
    'user',
    'xhr',
    'utils'
];

describe('factory', () => {
    afterEach(() => {
        fetchMock.restore();
    });

    it('should create default instance with default import', () => {
        defaultSdk.config.setCustomDomain('secure.gooddata.com');
        fetchMock.mock('https://secure.gooddata.com/some/url', { status: 200, body: 'hello from secure' });

        return defaultSdk.xhr.ajax('/some/url').then((response) => {
            expect(response.response.status).toBe(200);
            return response.responseBody;
        }).then((body) => {
            expect(body).toBe('hello from secure');
        });
    });

    it('should create instance of SDK', () => {
        const sdk = factory();
        fetchMock.mock('/some/url', { status: 200, body: 'hello' });

        modules.forEach(m => expect(sdk).toHaveProperty(m));

        return sdk.xhr.ajax('/some/url').then((response) => {
            expect(response.response.status).toBe(200);
            return response.responseBody;
        }).then((body) => {
            expect(body).toBe('hello');
        });
    });

    it('should create clone()', () => {
        const sdk1 = factory();
        sdk1.config.setCustomDomain('beddata.com');

        const sdk2 = sdk1.clone();
        expect(sdk2.config.getCustomDomain()).toEqual('https://beddata.com');

        sdk2.config.setCustomDomain('chairdata.com');
        expect(sdk1.config.getCustomDomain()).toEqual('https://beddata.com');
        expect(sdk2.config.getCustomDomain()).toEqual('https://chairdata.com');
    });

    it('should create instances with custom domains', () => {
        const sdkStg3 = factory({ domain: 'staging3.intgdc.com' });
        const sdkStg2 = factory({ domain: 'staging2.intgdc.com' });

        expect(sdkStg3.config.getCustomDomain()).toEqual('https://staging3.intgdc.com');
        expect(sdkStg2.config.getCustomDomain()).toEqual('https://staging2.intgdc.com');
        fetchMock.mock('https://staging3.intgdc.com/some/url', { status: 200, body: 'hello from stg3' });
        fetchMock.mock('https://staging2.intgdc.com/some/url', { status: 200, body: 'hello from stg2' });

        return Promise.all([
            sdkStg3.xhr.ajax('/some/url')
                .then(r => r.responseBody)
                .then((body) => {
                    expect(body).toEqual('hello from stg3');
                }),
            sdkStg2.xhr.ajax('/some/url')
                .then(r => r.responseBody)
                .then((body) => {
                    expect(body).toEqual('hello from stg2');
                })
        ]);
    });
});
