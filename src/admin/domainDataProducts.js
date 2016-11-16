import { get } from '../xhr';
import * as routes from './routes';

const transformDomainDataProduct = ({ domainDataProduct }) => {
    const { domainId } = routes.parse(domainDataProduct.links.domain, routes.CONTRACT_DOMAIN);
    return {
        domainDataProduct: {
            domainId,
            ...domainDataProduct
        }
    };
};

export const getDomainDataProducts = (contractId, dataProductId) =>
    get(routes.interpolate(routes.CONTRACT_DATA_PRODUCT_DOMAIN_DATA_PRODUCTS, { contractId, dataProductId }))
    .then(({ domainDataProducts: { items } }) => ({
        domainDataProducts: {
            items: items.map(transformDomainDataProduct)
        }
    }));
