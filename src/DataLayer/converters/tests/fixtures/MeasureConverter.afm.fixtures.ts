// (C) 2007-2020 GoodData Corporation
import { AFM } from "@gooddata/typings";
import IMeasure = AFM.IMeasure;

export const simpleMeasureWithUri: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
        },
    },
    alias: "Measure M1",
};

export const simpleMeasureWithIdentifiers: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                identifier: "metric.id",
            },
        },
    },
    alias: "Measure M1",
};

export const simpleMeasureWithFormat: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
        },
    },
    alias: "Measure M1",
    format: "$#,##0 custom",
};

export const renamedMeasure: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
        },
    },
    alias: "Alias A1",
};

export const measureWithFilters: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
            filters: [
                {
                    absoluteDateFilter: {
                        dataSet: {
                            uri: "/gdc/md/project/333",
                        },
                        from: "2016-01-01",
                        to: "2017-01-01",
                    },
                },
                {
                    relativeDateFilter: {
                        dataSet: {
                            uri: "/gdc/md/project/333",
                        },
                        granularity: "GDC.time.date",
                        from: -89,
                        to: 0,
                    },
                },
                {
                    positiveAttributeFilter: {
                        displayForm: {
                            uri: "/gdc/md/project/obj/1",
                        },
                        in: ["/gdc/md/project/obj/11?id=1", "/gdc/md/project/obj/11?id=2"],
                    },
                },
            ],
        },
    },
    alias: "Measure M1",
};

export const showInPercentMeasure: IMeasure = {
    localIdentifier: "m1",
    format: "#,##0.00%",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
            computeRatio: true,
        },
    },
    alias: "Measure M1",
};

export const showInPercentWithCustomFormat: IMeasure = {
    localIdentifier: "m1",
    format: "$#,##0 custom",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/metric.id",
            },
            computeRatio: true,
        },
    },
    alias: "Measure M1",
};

export const factBasedMeasure: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/fact.id",
            },
            aggregation: "sum",
        },
    },
};

export const factBasedMeasureWithCustomFormat: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/fact.id",
            },
            aggregation: "sum",
        },
    },
    format: "$#,##0 custom",
};

export const attributeBasedMeasure: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/1",
            },
            aggregation: "count",
        },
    },
    format: "#,##0",
};

export const attributeBasedMeasureWithCustomFormat: IMeasure = {
    localIdentifier: "m1",
    definition: {
        measure: {
            item: {
                uri: "/gdc/md/project/obj/1",
            },
            aggregation: "count",
        },
    },
    format: "$#,##0 custom",
};

export const popMeasure: IMeasure = {
    localIdentifier: "m1_pop",
    definition: {
        popMeasure: {
            measureIdentifier: "m1",
            popAttribute: {
                uri: "/gdc/md/project/obj/11",
            },
        },
    },
    alias: "Measure M1 - SP year ago",
};

export const popMeasureWithCustomFormat: IMeasure = {
    localIdentifier: "m1_pop",
    definition: {
        popMeasure: {
            measureIdentifier: "m1",
            popAttribute: {
                uri: "/gdc/md/project/obj/11",
            },
        },
    },
    alias: "Measure M1 - SP year ago",
    format: "$#,##0 custom",
};

export const previousPeriodMeasure: IMeasure = {
    localIdentifier: "m1_pop",
    alias: "Measure M1 - previous period",
    definition: {
        previousPeriodMeasure: {
            measureIdentifier: "m1",
            dateDataSets: [
                {
                    dataSet: {
                        uri: "/gdc/md/project/obj/1",
                    },
                    periodsAgo: 1,
                },
                {
                    dataSet: {
                        uri: "/gdc/md/project/obj/1",
                    },
                    periodsAgo: 2,
                },
            ],
        },
    },
};

export const arithmeticMeasure: IMeasure = {
    localIdentifier: "arithmetic_measure_1",
    alias: "Sum of m1 and m2",
    definition: {
        arithmeticMeasure: {
            measureIdentifiers: ["m1", "m2"],
            operator: "sum",
        },
    },
};

export const arithmeticMeasureWithCustomFormat: IMeasure = {
    localIdentifier: "arithmetic_measure_1",
    alias: "Sum of m1 and m2",
    definition: {
        arithmeticMeasure: {
            measureIdentifiers: ["m1", "m2"],
            operator: "sum",
        },
    },
    format: "$#,##0 custom",
};

export const arithmeticMeasureChange: IMeasure = {
    localIdentifier: "arithmetic_measure_1",
    alias: "Sum of m1 and m2",
    format: "#,##0.00%",
    definition: {
        arithmeticMeasure: {
            measureIdentifiers: ["m1", "m2"],
            operator: "change",
        },
    },
};

export const arithmeticMeasureWithChangeOperatorAndCustomFormat: IMeasure = {
    localIdentifier: "arithmetic_measure_1",
    alias: "Sum of m1 and m2",
    format: "$#,##0 custom",
    definition: {
        arithmeticMeasure: {
            measureIdentifiers: ["m1", "m2"],
            operator: "change",
        },
    },
};
