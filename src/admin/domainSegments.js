import { get } from '../xhr';
import * as routes from './routes';

const transformDomainSegment = (item) => {
    const params = routes.parse(item.domainSegment.links.self,
        routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN);

    return {
        contractId: params.contractId,
        dataProductId: params.dataProductId,
        segmentId: params.segmentId,
        domainId: params.domainId,
        ...item.domainSegment
    };
};

export const getDomainSegments = (contractId, dataProductId, segmentId, query) => {
    return get(routes.interpolate(
        routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS,
        { contractId, dataProductId, segmentId },
        query
    ))
    .then(result => ({ items: result.domainSegments.items.map(transformDomainSegment) }));
};

export const getDomainSegment = (contractId, dataProductId, segmentId, domainId, query) => {
    return get(routes.interpolate(
        routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN,
        { contractId, dataProductId, segmentId, domainId },
        query
    ))
    .then(result => transformDomainSegment(result));
};

export const cloneDomainSegment = (contractId, dataProductId, segmentId, domainId, newSegmentId, newDomainId) =>
    post(
        routes.interpolate(
            routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN_CLONE,
            { contractId, dataProductId, segmentId, domainId }
        ),
        {
            data: JSON.stringify({
                cloneSegmentRequest: {
                    clonedSegmentId: newSegmentId,
                    domain: newDomainId
                }
            })
        }
    );
