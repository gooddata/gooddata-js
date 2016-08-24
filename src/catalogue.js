import { get, find, omit, cloneDeep, set } from 'lodash';
import * as xhr from './xhr';
import { mdToExecutionConfiguration } from './execution';

const REQUEST_DEFAULTS = {
    types: ['attribute', 'metric', 'fact'],
    paging: {
        offset: 0
    }
};

const WHERE_REGEXP = /\s+WHERE\s+\[[^\]]+\]\s+(NOT\s+)*IN\s+\([^)]+\)/g;

const LOAD_DATE_DATASET_DEFAULTS = {
    includeUnavailableDateDataSetsCount: true,
    includeAvailableDateAttributes: true
};

const parseCategories = (bucketItems) => (
    get(bucketItems, 'categories').map(({ category }) => ({
            category: {
                ...category,
                displayForm: get(category, 'attribute')
            }
        })
    )
);

function bucketItemsToExecConfig(bucketItems, options = {}) {
    const categories = parseCategories(bucketItems);
    const executionConfig = mdToExecutionConfiguration({
        buckets: {
            ...bucketItems,
            categories
        }
    }, options);
    const definitions = get(executionConfig, 'definitions');

    // replace metric filters to speed up processing of availability
    definitions.forEach(({ metricDefinition }) => {
        const maql = get(metricDefinition, 'expression');
        set(metricDefinition, 'expression', maql.replace(WHERE_REGEXP, ''));
    });

    return get(executionConfig, 'columns').map(column => {
        const definition = find(definitions, ({ metricDefinition }) =>
            get(metricDefinition, 'identifier') === column
        );
        const maql = get(definition, 'metricDefinition.expression');

        if (maql) {
            return maql;
        }
        return column;
    });
}

/**
 * Convert specific params in options to "requiredDataSets" structure. For more details look into
 * res file https://github.com/gooddata/gdc-bear/blob/develop/resources/specification/internal/catalog.res
 *
 * @param options Supported keys in options are:
 * <ul>
 * <li>dataSetIdentifier - in value is string identifier of dataSet - this leads to CUSTOM type
 * <li>returnAllDateDataSets - true value means to return ALL values without dataSet differentiation
 * <li>by default we get PRODUCTION dataSets
 * </ul>
 * @returns {Object} "requiredDataSets" object hash.
 */
const getRequiredDataSets = options => {
    if (get(options, 'returnAllDateDataSets')) {
        return {
            type: 'ALL'
        };
    } else if (get(options, 'dataSetIdentifier')) {
        return {
            type: 'CUSTOM',
            customIdentifiers: [ get(options, 'dataSetIdentifier') ]
        };
    }
    return {
        type: 'PRODUCTION'
    };
};

function loadCatalog(projectId, request) {
    const uri = `/gdc/internal/projects/${projectId}/loadCatalog`;
    return xhr.ajax(uri, {
        type: 'POST',
        data: { catalogRequest: request }
    }).then(data => data.catalogResponse);
}

export function loadItems(projectId, options = {}) {
    const request = omit({
        ...REQUEST_DEFAULTS,
        ...options,
        requiredDataSets: getRequiredDataSets(options)
    }, ['dataSetIdentifier', 'returnAllDateDataSets']);

    let bucketItems = get(cloneDeep(options), 'bucketItems.buckets');
    if (bucketItems) {
        bucketItems = bucketItemsToExecConfig(bucketItems);
        return loadCatalog(
            projectId,
            {
                ...request,
                bucketItems
            }
        );
    }

    return loadCatalog(projectId, request);
}

function requestDateDataSets(projectId, request) {
    const uri = `/gdc/internal/projects/${projectId}/loadDateDataSets`;

    return xhr.ajax(uri, {
        type: 'POST',
        data: { dateDataSetsRequest: request }
    });
}

export function loadDateDataSets(projectId, options) {
    let bucketItems = get(cloneDeep(options), 'bucketItems.buckets');

    if (bucketItems) {
        bucketItems = bucketItemsToExecConfig(bucketItems, { removeDateItems: true });
    }

    const requiredDataSets = getRequiredDataSets(options);

    const request = omit({
        ...LOAD_DATE_DATASET_DEFAULTS,
        ...REQUEST_DEFAULTS,
        ...options,
        requiredDataSets,
        bucketItems
    }, ['filter', 'types', 'paging', 'dataSetIdentifier', 'returnAllDateDataSets']);

    return requestDateDataSets(projectId, request);
}
