// (C) 2007-2019 GoodData Corporation
import { VisualizationObject, AFM } from '@gooddata/typings';
import flow = require('lodash/flow');
import isEmpty = require('lodash/isEmpty');
import omit = require('lodash/omit');
import { v4 as uuid } from 'uuid';

import { IProperties, IColorMappingProperty } from './interfaces';
import { isUri } from './DataLayer/helpers/uri';

export type IVisualizationObject = VisualizationObject.IVisualizationObject;
export type IReferenceItems = VisualizationObject.IReferenceItems;

/*
 * Helpers
 */
export const getReferenceValue = (id: string, references: IReferenceItems) => references[id];
export const getReferenceId = (value: string, references: IReferenceItems) =>
    Object.keys(references).find(id => references[id] === value);

export type IdGenerator = () => string;

export const defaultIdGenerator: IdGenerator = () => uuid().replace(/-/g, '');

export interface IConversionIntermediateBase {
    properties: IProperties;
    references: IReferenceItems;
}

export interface IConversionIntermediate extends IConversionIntermediateBase {
    originalReferences: IReferenceItems;
    idGenerator: () => string;
}

export type IntermediateConversion = (result: IConversionIntermediate) => IConversionIntermediate;

export const createConverter = (
    initialization: (properties: IProperties, references: IReferenceItems) => IConversionIntermediateBase,
    ...conversions: IntermediateConversion[]
) => (mdObject: IVisualizationObject, idGenerator: IdGenerator = defaultIdGenerator): IVisualizationObject => {
    const { content } = mdObject;
    if (!content) {
        return mdObject;
    }

    const { properties } = content;
    if (!properties) {
        return mdObject;
    }

    // prepare result objects
    const originalProperties: IProperties = JSON.parse(properties);
    const originalReferences = content.references || {};

    // perform the conversion
    const conversionFlow: IntermediateConversion = flow(conversions);

    const { properties: convertedProperties, references: convertedReferences } =
        conversionFlow({
            ...initialization(originalProperties, originalReferences),
            originalReferences,
            idGenerator
        });

    // set the new properties and references
    const referencesProp = isEmpty(convertedReferences) ? undefined : { references: convertedReferences };

    return {
        ...mdObject,
        content: {
            ...omit(mdObject.content, 'references') as VisualizationObject.IVisualizationObjectContent,
            properties: JSON.stringify(convertedProperties),
            ...referencesProp
        }
    };
};

/*
 * Conversion from References to URIs
 */
export const convertColorMappingReferencesToUris: IntermediateConversion = (conversionIntermediate) => {
    const { properties, references } = conversionIntermediate;

    const colorMapping = properties && properties.controls && properties.controls.colorMapping;
    if (!colorMapping) {
        return conversionIntermediate;
    }

    const convertedColorMapping = colorMapping.map((cm): IColorMappingProperty => {
        const { id } = cm;

        const resolvedValue = getReferenceValue(id, references);
        const result = resolvedValue || id;

        return { color: cm.color, id: result };
    });

    return {
        ...conversionIntermediate,
        properties: {
            ...conversionIntermediate.properties,
            controls: {
                ...conversionIntermediate.properties.controls,
                colorMapping: convertedColorMapping
            }
        }
    };
};

export const convertSortingReferencesToUris: IntermediateConversion = (conversionIntermediate) => {
    const { properties, references } = conversionIntermediate;

    const sortItems = properties && properties.sortItems;
    if (!sortItems) {
        return conversionIntermediate;
    }

    const convertedSortItems = sortItems.map((sortItem: AFM.SortItem): AFM.SortItem => {
        if (AFM.isMeasureSortItem(sortItem)) {
            const convertedSortItemLocators = sortItem.measureSortItem.locators.map((locator) => {
                if (!AFM.isMeasureLocatorItem(locator)) {
                    const id = locator.attributeLocatorItem.element;

                    // In case the id is not in reference to avoid fixable errors,
                    // use the ID as a value, because it might be an unsanitized uri
                    // log it as warning
                    const resolvedValue = getReferenceValue(id, references);
                    const element = resolvedValue || id;
                    if (!resolvedValue) {
                        // tslint:disable-next-line:no-console
                        console.warn(`References do not contain id: ${id}`);
                    }

                    return {
                        attributeLocatorItem: {
                            ...locator.attributeLocatorItem,
                            element
                        }
                    };
                }
                return locator;
            });
            return {
                measureSortItem: {
                    ...sortItem.measureSortItem,
                    locators: convertedSortItemLocators
                }
            };
        }
        return sortItem;
    });

    return {
        ...conversionIntermediate,
        properties: {
            ...conversionIntermediate.properties,
            sortItems: convertedSortItems
        }
    };
};

/**
 * Converts reference based values to actual URIs
 *
 * @param mdObject The object to convert properties of
 * @param [idGenerator=uuid] Function that returns unique ids
 */
export const convertReferencesToUris = createConverter(
    (properties, references) => ({ properties, references }),
    convertColorMappingReferencesToUris,
    convertSortingReferencesToUris
);

/*
 * Conversion from URIs to References
 */
export const convertColorMappingUrisToReferences: IntermediateConversion = (conversionIntermediate) => {
    const { properties, originalReferences, idGenerator } = conversionIntermediate;
    const references = { ...conversionIntermediate.references };

    const colorMapping = properties && properties.controls && properties.controls.colorMapping;
    if (!colorMapping) {
        return conversionIntermediate;
    }

    const convertedColorMapping = colorMapping.map((cm): IColorMappingProperty => {
        const { id } = cm;
        // only convert URI values, do not touch local identifiers
        if (isUri(id)) {
            const referenceId = getReferenceId(id, originalReferences) || idGenerator();
            references[referenceId] = id;
            return { color: cm.color, id: referenceId };
        }
        return cm;
    });

    return {
        ...conversionIntermediate,
        properties: {
            ...conversionIntermediate.properties,
            controls: {
                ...conversionIntermediate.properties.controls,
                colorMapping: convertedColorMapping
            }
        },
        references
    };
};

export const convertSortItemUrisToReferences: IntermediateConversion = (conversionIntermediate) => {
    const { properties, originalReferences, idGenerator } = conversionIntermediate;
    const references = { ...conversionIntermediate.references };

    const sortItems = properties && properties.sortItems;
    if (!sortItems) {
        return conversionIntermediate;
    }

    const convertedSortItems = sortItems.map((sortItem: AFM.SortItem): AFM.SortItem => {
        if (AFM.isMeasureSortItem(sortItem)) {
            const convertedSortItemLocators = sortItem.measureSortItem.locators.map((locator) => {
                if (!AFM.isMeasureLocatorItem(locator)) {
                    const uri = locator.attributeLocatorItem.element;
                    const id = getReferenceId(uri, originalReferences) || idGenerator();
                    references[id] = uri;
                    return {
                        attributeLocatorItem: {
                            ...locator.attributeLocatorItem,
                            element: id
                        }
                    };
                }
                return locator;
            });
            return {
                measureSortItem: {
                    ...sortItem.measureSortItem,
                    locators: convertedSortItemLocators
                }
            };
        }
        return sortItem;
    });

    return {
        ...conversionIntermediate,
        properties: {
            ...conversionIntermediate.properties,
            sortItems: convertedSortItems
        },
        references
    };
};

/**
 * Converts URIs to reference based values
 *
 * @param mdObject The object to convert properties of
 * @param [idGenerator=uuid] Function that returns unique ids
 */
export const convertUrisToReferences = createConverter(
    (properties, _references) => ({ properties, references: {} }),
    convertColorMappingUrisToReferences,
    convertSortItemUrisToReferences
);
