import * as routes from './routes';

export function createModule(xhr) {
    const getUserContracts = () => xhr.get(routes.CONTRACTS)
        .then((r => r.getData()))
        .then(data => ({
            items: data.contracts.items.map(item => item.contract),
            paging: data.contracts.paging
        }));

    return {
        getUserContracts
    };
}
