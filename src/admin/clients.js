import { get } from '../xhr';
import * as routes from './routes';

const transformClient = item => {
    const params = routes.parse(item.client.links.self, routes.CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN_CLIENTS);
    return {
        contractId: params.contractId,
        dataProductId: params.dataProductId,
        segmentId: params.segmentId,
        domainId: params.domainId,
        ...item.client
    };
};

export const getClients = (contractId, dataProductId, segmentId, domainId, filter, paging) => {
    const query = filter ? { clientPrefix: filter, stats: 'user' } : { stats: 'user' };
    const uri = paging ? paging.next : routes.interpolate(routes.CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN_CLIENTS, { contractId, dataProductId, segmentId, domainId }, query);

    return get(uri).then(result => ({ items: result.client.items.map(transformClient), paging: result.client.paging }));
};
