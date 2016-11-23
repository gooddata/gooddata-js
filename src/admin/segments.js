import { get, post } from '../xhr';
import * as routes from './routes';

export const getDataProductSegments = (contractId, dataProductId) =>
    get(routes.interpolate(routes.CONTRACT_DATA_PRODUCT_SEGMENTS, { contractId, dataProductId })).then(data => ({
        items: data.segments.items.map(item => ({
            ...item.segment,
            dataProductId
        })),
        status: data.segments.status
    })
);

export const createSegment = (contractId, dataProductId, segmentId, domainId) =>
    post(routes.interpolate(routes.CONTRACT_DATA_PRODUCT_SEGMENTS, { contractId, dataProductId }), {
        data: JSON.stringify({
            segmentCreate: {
                id: segmentId,
                domain: [routes.interpolate(routes.CONTRACT_DOMAIN,
                    { contractId, domainId })]
            }
        })
    });
