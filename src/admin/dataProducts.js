import { get, post, deleteObject } from '../xhr';
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

export const createDataProduct = (contractId, dataProductId, domainIds) =>
    post(routes.interpolate(routes.CONTRACT_DATA_PRODUCTS, { contractId }), {
        data: JSON.stringify({
            dataProductCreate: {
                id: dataProductId,
                domains: domainIds.map(domainId => routes.interpolate(routes.CONTRACT_DOMAIN, { contractId, domainId }))
            }
        })
    });

export const deleteDataProduct = (contractId, dataProductId) =>
    deleteObject(routes.interpolate(routes.CONTRACT_DATA_PRODUCT, { contractId, dataProductId }));
