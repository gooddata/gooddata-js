import { get } from '../xhr';
import * as routes from './routes';

const transformClient = (item) => {
    const params = routes.parse(item.client.links.self, routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN_CLIENTS);
    return {
        ...params,
        ...item.client
    };
};

export const getClients = (contractId, dataProductId, segmentId, domainId, filter, paging) => {
    const query = filter ? { clientPrefix: filter, stats: 'user' } : { stats: 'user' };
    const uri = paging ?
        paging.next :
        routes.interpolate(
            routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN_CLIENTS,
            { contractId, dataProductId, segmentId, domainId },
            query
        );

    return get(uri).then(result => ({ items: result.client.items.map(transformClient), paging: result.client.paging }));
};

const transformClientUser = (item) => {
    const user = item.projectUser;
    return {
        id: user.login,
        fullName: `${user.firstName} ${user.lastName}`,
        ...user
    };
};

export const getClientUsers = (contractId, dataProductId, domainId, segmentId, clientId, query, paging) => {
    if (paging && !paging.next) {
        return Promise.resolve({ items: [], paging: {} });
    }

    const uri = paging ?
        paging.next :
        routes.interpolate(
            routes.CONTRACT_DATA_PRODUCT_DOMAIN_SEGMENTS_DOMAIN_CLIENT_USERS,
            { contractId, dataProductId, domainId, segmentId, clientId },
            query
        );

    return get(uri).then(result => ({
        ...result.clientProjectUsers,
        items: result.clientProjectUsers.items.map(transformClientUser)
    }));
};
