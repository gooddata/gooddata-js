import { get } from '../xhr';
import * as routes from './routes';

const transformSegment = item => {
    const params = routes.parse(item.domainSegment.links.self, routes.CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN);
    return {
        contractId: params.contractId,
        dataProductId: params.dataProductId,
        segmentId: params.segmentId,
        domainId: params.domainId,
        ...item.domainSegment
    };
};

export const getDomainSegments = (contractId, dataProductId, segmentId, query) => {
    return get(routes.interpolate(routes.CONTRACT_DATA_PRODUCT_SEGMENT_DOMAINS, { contractId, dataProductId, segmentId }, query))
        .then(result => ({ items: result.domainSegments.items.map(transformSegment) }));
};

export const getDomainSegment = (contractId, dataProductId, segmentId, domainId) => {
    return get(routes.interpolate(routes.CONTRACT_DATA_PRODUCT_SEGMENT_DOMAIN, { contractId, dataProductId, segmentId, domainId }))
        .then(result => transformSegment(result.domainSegment));
};
