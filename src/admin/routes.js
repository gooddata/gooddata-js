export const ROOT = '/gdc/admin';

export const CONTRACTS = `${ROOT}/contracts`;
export const CONTRACT = `${CONTRACTS}/:contractId`;

export const CONTRACT_DATA_PRODUCTS = `${CONTRACT}/dataProducts`;
export const CONTRACT_DATA_PRODUCT = `${CONTRACT_DATA_PRODUCTS}/:dataProductId`;
export const CONTRACT_DATA_PRODUCTS_DOMAINS = `${CONTRACT_DATA_PRODUCTS}/domains`;
export const CONTRACT_DATA_PRODUCT_DOMAINS = `${CONTRACT_DATA_PRODUCT}/domains`;
export const CONTRACT_DATA_PRODUCT_DOMAIN = `${CONTRACT_DATA_PRODUCT_DOMAINS}/:domainId`;

export const CONTRACT_DATA_PRODUCT_SEGMENTS = `${CONTRACT_DATA_PRODUCT}/segments`;
export const CONTRACT_DATA_PRODUCT_SEGMENT = `${CONTRACT_DATA_PRODUCT_SEGMENTS}/:segmentId`;
export const CONTRACT_DATA_PRODUCT_SEGMENT_DOMAINS = `${CONTRACT_DATA_PRODUCT_SEGMENT}/domains`;
export const CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN = `${CONTRACT_DATA_PRODUCT_SEGMENT_DOMAINS}/:domainId`;
export const CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN_CLIENTS = `${CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN}/clients`;

export const CONTRACT_DOMAINS = `${CONTRACT}/domains`;
export const CONTRACT_DOMAIN = `${CONTRACT_DOMAINS}/:domainId`;
export const CONTRACT_DOMAIN_USERS = `${CONTRACT_DOMAIN}/users`;

export const CONTRACT_USERS = `${CONTRACT}/users`;

export const USER_CONTRACTS = `${ROOT}/users/:userId/contracts`;

// parse params in route string accoring to template
// returns params as plain object
export const parse = (route, template) => {
    const values = route.split('/');
    const views = template.split('/');

    return views.reduce((result, view, idx) => {
        if (view[0] === ':') {
            return {
                ...result,
                [view.substr(1)]: values[idx]
            };
        }
        return result;
    }, {});
};

// creates a query string from a plain js object
export const queryString = query => (
    query ?
        `?${Object.keys(query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&')}` :
        ''
);

// interpolates specified parameters from params into
// the specified route string and returns the result
export const interpolate = (route, params, query) =>
    route.split('/').map(view => (view[0] === ':' ? params[view.substr(1)] : view)).join('/') + queryString(query);
