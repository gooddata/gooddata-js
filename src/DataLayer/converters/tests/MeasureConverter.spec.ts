// (C) 2007-2020 GoodData Corporation
import * as measures from "./fixtures/MeasureConverter.visObj.fixtures";
import * as afm from "./fixtures/MeasureConverter.afm.fixtures";
import MeasureConverter from "../MeasureConverter";
import { VisualizationObject } from "@gooddata/typings";
import IMeasure = VisualizationObject.IMeasure;

function addFormat(measure: IMeasure) {
    return {
        measure: {
            ...measure.measure,
            format: "$#,##0 custom",
        },
    };
}

describe("convertMeasure", () => {
    it.each`
        testCase                                                 | inputVizObjMeasure                             | outputAfmMeasure
        ${"simple measures defined by URI"}                      | ${measures.simpleMeasureWithUri}               | ${afm.simpleMeasureWithUri}
        ${"simple measure defined by identifier"}                | ${measures.simpleMeasureWithIdentifiers}       | ${afm.simpleMeasureWithIdentifiers}
        ${"simple measure, keeping custom format"}               | ${addFormat(measures.simpleMeasureWithUri)}    | ${afm.simpleMeasureWithFormat}
        ${"measure with filters"}                                | ${measures.measureWithFilters}                 | ${afm.measureWithFilters}
        ${"renamed measure"}                                     | ${measures.renamedMeasure}                     | ${afm.renamedMeasure}
        ${"fact-based measure, not adding default format"}       | ${measures.factBasedMeasure}                   | ${afm.factBasedMeasure}
        ${"fact-based measure, keeping custom format"}           | ${addFormat(measures.factBasedMeasure)}        | ${afm.factBasedMeasureWithCustomFormat}
        ${"attribute-based measure, adding default format"}      | ${measures.attributeBasedMeasure}              | ${afm.attributeBasedMeasure}
        ${"attribute-based measure, keeping custom format"}      | ${addFormat(measures.attributeBasedMeasure)}   | ${afm.attributeBasedMeasureWithCustomFormat}
        ${"POP measure, not adding default format"}              | ${measures.popMeasure}                         | ${afm.popMeasure}
        ${"POP measure, keeping default format"}                 | ${addFormat(measures.popMeasure)}              | ${afm.popMeasureWithCustomFormat}
        ${"previous period measure, not adding default format"}  | ${measures.previousPeriodMeasure}              | ${afm.previousPeriodMeasure}
        ${"measure with show in percent, adding default format"} | ${measures.showInPercentMeasure}               | ${afm.showInPercentMeasure}
        ${"measure with show in percent, keeping custom format"} | ${addFormat(measures.showInPercentMeasure)}    | ${afm.showInPercentWithCustomFormat}
        ${"arithmetic measure, not adding default format"}       | ${measures.arithmeticMeasure}                  | ${afm.arithmeticMeasure}
        ${"arithmetic measure, keeping custom format"}           | ${addFormat(measures.arithmeticMeasure)}       | ${afm.arithmeticMeasureWithCustomFormat}
        ${"arithmetic measure-change, adding default format"}    | ${measures.arithmeticMeasureChange}            | ${afm.arithmeticMeasureChange}
        ${"arithmetic measure-change, keeping custom format"}    | ${addFormat(measures.arithmeticMeasureChange)} | ${afm.arithmeticMeasureWithChangeOperatorAndCustomFormat}
    `(`should convert $testCase`, ({ inputVizObjMeasure, outputAfmMeasure }) => {
        expect(MeasureConverter.convertMeasure(inputVizObjMeasure)).toEqual(outputAfmMeasure);
    });
});
