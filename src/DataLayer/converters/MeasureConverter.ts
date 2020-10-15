// (C) 2007-2020 GoodData Corporation
import compact from "lodash/compact";
import { AFM, VisualizationObject } from "@gooddata/typings";

import IArithmeticMeasureDefinition = VisualizationObject.IArithmeticMeasureDefinition;
import IMeasure = VisualizationObject.IMeasure;
import IMeasureDefinition = VisualizationObject.IMeasureDefinition;
import IMeasureDefinitionType = VisualizationObject.IMeasureDefinitionType;
import IPoPMeasureDefinition = VisualizationObject.IPoPMeasureDefinition;
import IPreviousPeriodMeasureDefinition = VisualizationObject.IPreviousPeriodMeasureDefinition;

import { convertVisualizationObjectFilter } from "./FilterConverter";
import { DEFAULT_INTEGER_FORMAT, DEFAULT_PERCENTAGE_FORMAT } from "../constants/formats";

const MeasureConverter = {
    convertMeasure,
};

export default MeasureConverter;

function convertMeasure(measure: IMeasure): AFM.IMeasure {
    const {
        measure: { definition },
    } = measure;

    const convertedDefinition = convertMeasureDefinition(definition);

    const format = getFormat(measure);
    const formatProp = format ? { format } : {};

    const alias = measure.measure.alias ? measure.measure.alias : measure.measure.title;
    const aliasProp = alias ? { alias } : {};

    return {
        localIdentifier: measure.measure.localIdentifier,
        definition: convertedDefinition,
        ...aliasProp,
        ...formatProp,
    };
}

function convertMeasureDefinition(definition: IMeasureDefinitionType): AFM.MeasureDefinition {
    if (VisualizationObject.isMeasureDefinition(definition)) {
        return convertSimpleMeasureDefinition(definition);
    } else if (VisualizationObject.isPopMeasureDefinition(definition)) {
        return convertPopMeasureDefinition(definition);
    } else if (VisualizationObject.isPreviousPeriodMeasureDefinition(definition)) {
        return convertPreviousPeriodMeasureDefinition(definition);
    } else if (VisualizationObject.isArithmeticMeasureDefinition(definition)) {
        return convertArithmeticMeasureDefinition(definition);
    } else {
        throw Error("The measure definition is not supported: " + JSON.stringify(definition));
    }
}

function convertSimpleMeasureDefinition(definition: IMeasureDefinition): AFM.ISimpleMeasureDefinition {
    const { measureDefinition } = definition;

    const filters: AFM.FilterItem[] = measureDefinition.filters
        ? compact(measureDefinition.filters.map(convertVisualizationObjectFilter))
        : [];
    const filtersProp = filters.length ? { filters } : {};

    const aggregation = measureDefinition.aggregation;
    const aggregationProp = aggregation ? { aggregation } : {};

    const computeRatio = measureDefinition.computeRatio;
    const computeRatioProp = computeRatio ? { computeRatio } : {};

    return {
        measure: {
            item: measureDefinition.item,
            ...filtersProp,
            ...aggregationProp,
            ...computeRatioProp,
        },
    };
}

function convertPopMeasureDefinition(definition: IPoPMeasureDefinition): AFM.IPopMeasureDefinition {
    const { popMeasureDefinition } = definition;
    return {
        popMeasure: {
            measureIdentifier: popMeasureDefinition.measureIdentifier,
            popAttribute: popMeasureDefinition.popAttribute,
        },
    };
}

function convertPreviousPeriodMeasureDefinition(
    definition: IPreviousPeriodMeasureDefinition,
): AFM.IPreviousPeriodMeasureDefinition {
    const { previousPeriodMeasure } = definition;
    return {
        previousPeriodMeasure: {
            measureIdentifier: previousPeriodMeasure.measureIdentifier,
            dateDataSets: previousPeriodMeasure.dateDataSets.map(dateDataSet => ({
                dataSet: dateDataSet.dataSet,
                periodsAgo: dateDataSet.periodsAgo,
            })),
        },
    };
}

function convertArithmeticMeasureDefinition(
    definition: IArithmeticMeasureDefinition,
): AFM.IArithmeticMeasureDefinition {
    const { arithmeticMeasure } = definition;
    return {
        arithmeticMeasure: {
            measureIdentifiers: arithmeticMeasure.measureIdentifiers.slice(),
            operator: arithmeticMeasure.operator,
        },
    };
}

function getFormat(measure: IMeasure): string | undefined {
    const {
        measure: { definition, format },
    } = measure;

    if (format) {
        return format;
    }

    const isArithmeticMeasureChange =
        VisualizationObject.isArithmeticMeasureDefinition(definition) &&
        definition.arithmeticMeasure.operator === "change";
    if (isArithmeticMeasureChange) {
        return DEFAULT_PERCENTAGE_FORMAT;
    }

    if (VisualizationObject.isMeasureDefinition(definition)) {
        const { measureDefinition } = definition;
        if (measureDefinition.computeRatio) {
            return DEFAULT_PERCENTAGE_FORMAT;
        }
        if (measureDefinition.aggregation === "count") {
            return DEFAULT_INTEGER_FORMAT;
        }
    }

    return undefined;
}
