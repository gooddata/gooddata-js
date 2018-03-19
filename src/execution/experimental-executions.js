// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
import md5 from 'md5';
import invariant from 'invariant';
import {
    cloneDeep,
    compact,
    filter,
    first,
    find,
    map,
    merge,
    every,
    get,
    isEmpty,
    negate,
    partial,
    flatten,
    set
} from 'lodash';

import Rules from '../utils/rules';
import { sortDefinitions } from '../utils/definitions';
import {
    getMissingUrisInAttributesMap
} from '../utils/attributesMapLoader';
import {
    getAttributes,
    getMeasures,
    getMeasureFilters,
    getDefinition,
    isAttributeMeasureFilter,
    getAttributesDisplayForms
} from '../utils/visualizationObjectHelper';

const notEmpty = negate(isEmpty);

function findHeaderForMappingFn(mapping, header) {
    return ((mapping.element === header.id || mapping.element === header.uri) &&
        header.measureIndex === undefined);
}

function wrapMeasureIndexesFromMappings(metricMappings, headers) {
    if (metricMappings) {
        metricMappings.forEach((mapping) => {
            const header = find(headers, partial(findHeaderForMappingFn, mapping));
            if (header) {
                header.measureIndex = mapping.measureIndex;
                header.isPoP = mapping.isPoP;
            }
        });
    }
    return headers;
}

const emptyResult = {
    extendedTabularDataResult: {
        values: [],
        warnings: []
    }
};

const MAX_TITLE_LENGTH = 1000;

function getMetricTitle(suffix, title) {
    const maxLength = MAX_TITLE_LENGTH - suffix.length;
    if (title && title.length > maxLength) {
        if (title[title.length - 1] === ')') {
            return `${title.substring(0, maxLength - 2)}…)${suffix}`;
        }
        return `${title.substring(0, maxLength - 1)}…${suffix}`;
    }
    return `${title}${suffix}`;
}

const getBaseMetricTitle = partial(getMetricTitle, '');

const CONTRIBUTION_METRIC_FORMAT = '#,##0.00%';

function getPoPDefinition(measure) {
    return get(measure, ['definition', 'popMeasureDefinition'], {});
}

function getAggregation(measure) {
    return get(getDefinition(measure), 'aggregation', '').toLowerCase();
}

function isEmptyFilter(metricFilter) {
    if (get(metricFilter, 'positiveAttributeFilter')) {
        return isEmpty(get(metricFilter, ['positiveAttributeFilter', 'in']));
    }
    if (get(metricFilter, 'negativeAttributeFilter')) {
        return isEmpty(get(metricFilter, ['negativeAttributeFilter', 'notIn']));
    }
    if (get(metricFilter, 'absoluteDateFilter')) {
        return get(metricFilter, ['absoluteDateFilter', 'from']) === undefined && get(metricFilter, ['absoluteDateFilter', 'to']) === undefined;
    }
    return get(metricFilter, ['relativeDateFilter', 'from']) === undefined && get(metricFilter, ['relativeDateFilter', 'to']) === undefined;
}

function allFiltersEmpty(item) {
    return every(
        map(getMeasureFilters(item), f => isEmptyFilter(f))
    );
}

function isDerived(measure) {
    const aggregation = getAggregation(measure);
    return (aggregation !== '' || !allFiltersEmpty(measure));
}

function getAttrTypeFromMap(dfUri, attributesMap) {
    return get(get(attributesMap, [dfUri], {}), ['attribute', 'content', 'type']);
}

function getAttrUriFromMap(dfUri, attributesMap) {
    return get(get(attributesMap, [dfUri], {}), ['attribute', 'meta', 'uri']);
}

function isAttrFilterNegative(attributeFilter) {
    return get(attributeFilter, 'negativeAttributeFilter') !== undefined;
}

function getAttrFilterElements(attributeFilter) {
    const isNegative = isAttrFilterNegative(attributeFilter);
    const pathToElements = isNegative ? ['negativeAttributeFilter', 'notIn'] : ['positiveAttributeFilter', 'in'];
    return get(attributeFilter, pathToElements, []);
}

function getAttrFilterExpression(measureFilter, attributesMap) {
    const isNegative = get(measureFilter, 'negativeAttributeFilter', false);
    const detailPath = isNegative ? 'negativeAttributeFilter' : 'positiveAttributeFilter';
    const attributeUri = getAttrUriFromMap(get(measureFilter, [detailPath, 'displayForm', 'uri']), attributesMap);
    const elements = getAttrFilterElements(measureFilter);
    if (isEmpty(elements)) {
        return null;
    }
    const elementsForQuery = map(elements, e => `[${e}]`);
    const negative = isNegative ? 'NOT ' : '';

    return `[${attributeUri}] ${negative}IN (${elementsForQuery.join(',')})`;
}

function getDateFilterExpression() {
    // measure date filter was never supported
    return '';
}

function getFilterExpression(attributesMap, measureFilter) {
    if (isAttributeMeasureFilter(measureFilter)) {
        return getAttrFilterExpression(measureFilter, attributesMap);
    }
    return getDateFilterExpression(measureFilter);
}

function getGeneratedMetricExpression(item, attributesMap) {
    const aggregation = getAggregation(item).toUpperCase();
    const objectUri = get(getDefinition(item), 'item.uri');
    const where = filter(map(getMeasureFilters(item), partial(getFilterExpression, attributesMap)), e => !!e);

    return `SELECT ${aggregation ? `${aggregation}([${objectUri}])` : `[${objectUri}]`
    }${notEmpty(where) ? ` WHERE ${where.join(' AND ')}` : ''}`;
}

function getPercentMetricExpression(category, attributesMap, measure) {
    let metricExpressionWithoutFilters = `SELECT [${get(getDefinition(measure), 'item.uri')}]`;

    if (isDerived(measure)) {
        metricExpressionWithoutFilters = getGeneratedMetricExpression(set(cloneDeep(measure), ['definition', 'measureDefinition', 'filters'], []), attributesMap);
    }

    const attributeUri = getAttrUriFromMap(get(category, 'displayForm.uri'), attributesMap);
    const whereFilters = filter(map(getMeasureFilters(measure), partial(getFilterExpression, attributesMap)), e => !!e);
    const whereExpression = notEmpty(whereFilters) ? ` WHERE ${whereFilters.join(' AND ')}` : '';

    return `SELECT (${metricExpressionWithoutFilters}${whereExpression}) / (${metricExpressionWithoutFilters} BY ALL [${attributeUri}]${whereExpression})`;
}

function getPoPExpression(attributeUri, metricExpression) {
    return `SELECT ${metricExpression} FOR PREVIOUS ([${attributeUri}])`;
}

function getGeneratedMetricHash(title, format, expression) {
    return md5(`${expression}#${title}#${format}`);
}

function getMeasureType(measure) {
    const aggregation = getAggregation(measure);
    if (aggregation === '') {
        return 'metric';
    } else if (aggregation === 'count') {
        return 'attribute';
    }
    return 'fact';
}

function getGeneratedMetricIdentifier(item, aggregation, expressionCreator, hasher, attributesMap) {
    const [, , , prjId, , id] = get(getDefinition(item), 'item.uri', '').split('/');
    const identifier = `${prjId}_${id}`;
    const hash = hasher(expressionCreator(item, attributesMap));
    const hasNoFilters = isEmpty(getMeasureFilters(item));
    const type = getMeasureType(item);

    const prefix = (hasNoFilters || allFiltersEmpty(item)) ? '' : '_filtered';

    return `${type}_${identifier}.generated.${hash}${prefix}_${aggregation}`;
}

function isDateAttribute(attribute, attributesMap = {}) {
    return getAttrTypeFromMap(get(attribute, ['displayForm', 'uri']), attributesMap) !== undefined;
}

function getMeasureSorting(measure, mdObj) {
    const sorting = get(mdObj, ['properties', 'sortItems'], []);
    const matchedSorting = sorting.find((sortItem) => {
        const measureSortItem = get(sortItem, ['measureSortItem']);
        if (measureSortItem) {
            const identifier = get(measureSortItem, ['locators', 0, 'measureLocatorItem', 'measureIdentifier']); // only one item now, we support only 2d data
            return identifier === get(measure, 'localIdentifier');
        }
        return false;
    });
    if (matchedSorting) {
        return get(matchedSorting, ['measureSortItem', 'direction'], null);
    }
    return null;
}

function getCategorySorting(category, mdObj) {
    const sorting = get(mdObj, ['properties', 'sortItems'], []);
    const matchedSorting = sorting.find((sortItem) => {
        const attributeSortItem = get(sortItem, ['attributeSortItem']);
        if (attributeSortItem) {
            const identifier = get(attributeSortItem, ['attributeIdentifier']);
            return identifier === get(category, 'localIdentifier');
        }
        return false;
    });
    if (matchedSorting) {
        return get(matchedSorting, ['attributeSortItem', 'direction'], null);
    }
    return null;
}


const createPureMetric = (measure, mdObj, measureIndex) => ({
    element: get(measure, ['definition', 'measureDefinition', 'item', 'uri']),
    sort: getMeasureSorting(measure, mdObj),
    meta: { measureIndex }
});

function createDerivedMetric(measure, mdObj, measureIndex, attributesMap) {
    const { format } = measure;
    const sort = getMeasureSorting(measure, mdObj);
    const title = getBaseMetricTitle(measure.title);

    const hasher = partial(getGeneratedMetricHash, title, format);
    const aggregation = getAggregation(measure);
    const element = getGeneratedMetricIdentifier(
        measure,
        aggregation.length ? aggregation : 'base',
        getGeneratedMetricExpression,
        hasher,
        attributesMap);
    const definition = {
        metricDefinition: {
            identifier: element,
            expression: getGeneratedMetricExpression(measure, attributesMap),
            title,
            format
        }
    };

    return {
        element,
        definition,
        sort,
        meta: {
            measureIndex
        }
    };
}

function createContributionMetric(measure, mdObj, measureIndex, attributesMap) {
    const attribute = first(getAttributes(mdObj));
    const getMetricExpression = partial(getPercentMetricExpression, attribute, attributesMap);
    const title = getBaseMetricTitle(get(measure, 'title'));
    const hasher = partial(getGeneratedMetricHash, title, CONTRIBUTION_METRIC_FORMAT);
    const identifier = getGeneratedMetricIdentifier(measure, 'percent', getMetricExpression, hasher, attributesMap);
    return {
        element: identifier,
        definition: {
            metricDefinition: {
                identifier,
                expression: getMetricExpression(measure, attributesMap),
                title,
                format: CONTRIBUTION_METRIC_FORMAT
            }
        },
        sort: getMeasureSorting(measure, mdObj),
        meta: {
            measureIndex
        }
    };
}

function getOriginalMeasureForPoP(popMeasure, mdObj) {
    return getMeasures(mdObj).find(measure =>
        get(measure, 'localIdentifier') === get(getPoPDefinition(popMeasure), ['measureIdentifier'])
    );
}

function createPoPMetric(popMeasure, mdObj, measureIndex, attributesMap) {
    const title = getBaseMetricTitle(get(popMeasure, 'title'));
    const format = get(popMeasure, 'format');
    const hasher = partial(getGeneratedMetricHash, title, format);

    const attributeUri = get(popMeasure, 'definition.popMeasureDefinition.popAttribute.uri');
    const originalMeasure = getOriginalMeasureForPoP(popMeasure, mdObj);

    const originalMeasureExpression = `[${get(getDefinition(originalMeasure), ['item', 'uri'])}]`;
    let getMetricExpression = partial(getPoPExpression, attributeUri, originalMeasureExpression);

    if (isDerived(originalMeasure)) {
        const generated = createDerivedMetric(originalMeasure, mdObj, measureIndex, attributesMap);
        const generatedMeasureExpression = `(${get(generated, ['definition', 'metricDefinition', 'expression'])})`;
        getMetricExpression = partial(getPoPExpression, attributeUri, generatedMeasureExpression);
    }

    const identifier = getGeneratedMetricIdentifier(originalMeasure, 'pop', getMetricExpression, hasher, attributesMap);

    return {
        element: identifier,
        definition: {
            metricDefinition: {
                identifier,
                expression: getMetricExpression(),
                title,
                format
            }
        },
        sort: getMeasureSorting(popMeasure, mdObj),
        meta: {
            measureIndex,
            isPoP: true
        }
    };
}

function createContributionPoPMetric(popMeasure, mdObj, measureIndex, attributesMap) {
    const attributeUri = get(popMeasure, ['definition', 'popMeasureDefinition', 'popAttribute', 'uri']);

    const originalMeasure = getOriginalMeasureForPoP(popMeasure, mdObj);

    const generated = createContributionMetric(originalMeasure, mdObj, measureIndex, attributesMap);
    const title = getBaseMetricTitle(get(popMeasure, 'title'));

    const format = CONTRIBUTION_METRIC_FORMAT;
    const hasher = partial(getGeneratedMetricHash, title, format);

    const generatedMeasureExpression = `(${get(generated, ['definition', 'metricDefinition', 'expression'])})`;
    const getMetricExpression = partial(getPoPExpression, attributeUri, generatedMeasureExpression);

    const identifier = getGeneratedMetricIdentifier(originalMeasure, 'pop', getMetricExpression, hasher, attributesMap);

    return {
        element: identifier,
        definition: {
            metricDefinition: {
                identifier,
                expression: getMetricExpression(),
                title,
                format
            }
        },
        sort: getMeasureSorting(),
        meta: {
            measureIndex,
            isPoP: true
        }
    };
}

function categoryToElement(attributesMap, mdObj, category) {
    const element = getAttrUriFromMap(get(category, ['displayForm', 'uri']), attributesMap);
    return {
        element,
        sort: getCategorySorting(category, mdObj)
    };
}

function isPoP({ definition }) {
    return get(definition, 'popMeasureDefinition') !== undefined;
}
function isContribution({ definition }) {
    return get(definition, ['measureDefinition', 'computeRatio']);
}
function isPoPContribution(popMeasure, mdObj) {
    if (isPoP(popMeasure)) {
        const originalMeasure = getOriginalMeasureForPoP(popMeasure, mdObj);
        return isContribution(originalMeasure);
    }
    return false;
}
function isCalculatedMeasure({ definition }) {
    return get(definition, ['measureDefinition', 'aggregation']) === undefined;
}

const rules = new Rules();

rules.addRule(
    [isPoPContribution],
    createContributionPoPMetric
);

rules.addRule(
    [isPoP],
    createPoPMetric
);

rules.addRule(
    [isContribution],
    createContributionMetric
);

rules.addRule(
    [isDerived],
    createDerivedMetric
);

rules.addRule(
    [isCalculatedMeasure],
    createPureMetric
);

function getMetricFactory(measure, mdObj) {
    const factory = rules.match(measure, mdObj);

    invariant(factory, `Unknown factory for: ${measure}`);

    return factory;
}

function getExecutionDefinitionsAndColumns(mdObj, options, attributesMap) {
    const measures = getMeasures(mdObj);
    let attributes = getAttributes(mdObj);

    const metrics = flatten(map(measures, (measure, index) =>
        getMetricFactory(measure, mdObj)(measure, mdObj, index, attributesMap))
    );
    if (options.removeDateItems) {
        attributes = filter(attributes, attribute => !isDateAttribute(attribute, attributesMap));
    }
    attributes = map(attributes, partial(categoryToElement, attributesMap, mdObj));

    const columns = compact(map([...attributes, ...metrics], 'element'));
    return {
        columns,
        definitions: sortDefinitions(compact(map(metrics, 'definition')))
    };
}

export function createModule(xhr, loadAttributesMap) {
    function getAttributesMap(options, displayFormUris, projectId) {
        const attributesMap = get(options, 'attributesMap', {});

        const missingUris = getMissingUrisInAttributesMap(displayFormUris, attributesMap);
        return loadAttributesMap(projectId, missingUris).then((result) => {
            return {
                ...attributesMap,
                ...result
            };
        });
    }

    function mdToExecutionDefinitionsAndColumns(projectId, mdObj, options = {}) {
        const allDfUris = getAttributesDisplayForms(mdObj);
        const attributesMapPromise = getAttributesMap(options, allDfUris, projectId);

        return attributesMapPromise.then((attributesMap) => {
            return getExecutionDefinitionsAndColumns(mdObj, options, attributesMap);
        });
    }

    function loadExtendedDataResults(uri, settings, prevResult = emptyResult) {
        return new Promise((resolve, reject) => {
            xhr.ajax(uri, settings)
                .then((r) => {
                    const { response } = r;

                    if (response.status === 204) {
                        return {
                            status: response.status,
                            result: ''
                        };
                    }

                    return {
                        status: response.status,
                        result: r.getData()
                    };
                })
                .then(({ status, result }) => {
                    const values = [
                        ...get(prevResult, 'extendedTabularDataResult.values', []),
                        ...get(result, 'extendedTabularDataResult.values', [])
                    ];

                    const warnings = [
                        ...get(prevResult, 'extendedTabularDataResult.warnings', []),
                        ...get(result, 'extendedTabularDataResult.warnings', [])
                    ];

                    const updatedResult = merge({}, prevResult, {
                        extendedTabularDataResult: {
                            values,
                            warnings
                        }
                    });

                    const nextUri = get(result, 'extendedTabularDataResult.paging.next');
                    if (nextUri) {
                        resolve(loadExtendedDataResults(nextUri, settings, updatedResult));
                    } else {
                        resolve({ status, result: updatedResult });
                    }
                }, reject);
        });
    }

    /**
     * Module for execution on experimental execution resource
     *
     * @class execution
     * @module execution
     */

    /**
     * For the given projectId it returns table structure with the given
     * elements in column headers.
     *
     * @method getData
     * @param {String} projectId - GD project identifier
     * @param {Array} columns - An array of attribute or metric identifiers.
     * @param {Object} executionConfiguration - Execution configuration - can contain for example
     *                 property "where" containing query-like filters
     *                 property "orderBy" contains array of sorted properties to order in form
     *                      [{column: 'identifier', direction: 'asc|desc'}]
     * @param {Object} settings - Supports additional settings accepted by the underlying
     *                             xhr.ajax() calls
     *
     * @return {Object} Structure with `headers` and `rawData` keys filled with values from execution.
     */
    function getData(projectId, columns, executionConfiguration = {}, settings = {}) {
        const executedReport = {
            isLoaded: false
        };

        // Create request and result structures
        const request = {
            execution: { columns }
        };
        // enrich configuration with supported properties such as
        // where clause with query-like filters
        ['where', 'orderBy', 'definitions'].forEach((property) => {
            if (executionConfiguration[property]) {
                request.execution[property] = executionConfiguration[property];
            }
        });

        // Execute request
        return xhr.post(`/gdc/internal/projects/${projectId}/experimental/executions`, {
            ...settings,
            body: JSON.stringify(request)
        })
            .then((r => r.getData()))
            .then((response) => {
                executedReport.headers = wrapMeasureIndexesFromMappings(
                    get(executionConfiguration, 'metricMappings'), get(response, ['executionResult', 'headers'], []));

                // Start polling on url returned in the executionResult for tabularData
                return loadExtendedDataResults(response.executionResult.extendedTabularDataResult, settings);
            })
            .then((r) => {
                const { result, status } = r;

                return Object.assign({}, executedReport, {
                    rawData: get(result, 'extendedTabularDataResult.values', []),
                    warnings: get(result, 'extendedTabularDataResult.warnings', []),
                    isLoaded: true,
                    isEmpty: status === 204
                });
            });
    }

    return {
        getData,
        mdToExecutionDefinitionsAndColumns
    };
}
