import { get, post } from '../xhr';
import * as routes from './routes';

export const getDataProducts = contractId =>
    get(routes.interpolate(routes.CONTRACT_DATA_PRODUCTS, { contractId })).then(data => ({
        items: data.dataProducts.items.map(item => ({
            ...item.dataProduct,
            contractId
        }))
    })
);

export const getDataProduct = (contractId, dataProductId) =>
    get(routes.interpolate(routes.CONTRACT_DATA_PRODUCT, { contractId, dataProductId })).then(data => ({
        ...data.dataProduct,
        contractId
    })
);

export const createDataProduct = (contractId, id, domainIds) => new Promise((resolve, reject) => {
    post(routes.interpolate(routes.CONTRACT_DATA_PRODUCTS, { contractId }), {
        data: JSON.stringify({
            dataProductCreate: {
                id,
                domains: domainIds.map(item => `/gdc/admin/contracts/${contractId}/domains/${item}`)
            }
        })
    })
    .then(r => (r.ok ? resolve(r) : reject(r)));
});
