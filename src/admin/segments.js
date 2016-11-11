import { get } from '../xhr';
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
