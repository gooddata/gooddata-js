// (C) 2007-2019 GoodData Corporation
import { AFM, VisualizationObject } from "@gooddata/typings";
import compact = require("lodash/compact");
import isArray = require("lodash/isArray");
import { convertVisualizationObjectFilter } from "./DataLayer/converters/FilterConverter";
import { IExportConfigRequest, IExportResponse } from "./interfaces";
import { handleHeadPolling, IPollingOptions } from "./util";
import { ApiResponseError, XhrModule, ApiResponse } from "./xhr";

import VisualizationObjectFilter = VisualizationObject.VisualizationObjectFilter;

interface IResultExport {
    executionResult: string;
    exportConfig: IExportConfigRequest;
}

interface IExportResultPayload {
    resultExport: IResultExport;
}

// This code is returned from server, used for all languages
const ERROR_RESTRICTED_CODE = "Export to required format is not allowed for data flagged as restricted.";
const ERROR_RESTRICTED_MESSAGE = "You cannot export this insight because it contains restricted data.";

/**
 * Functions for working with reports
 *
 * @Class report
 * @module report
 */
export class ReportModule {
    constructor(private xhr: XhrModule) {}

    /**
     * exportResult
     * request new result export
     * request new export of existing AFM execution
     *
     * @experimental
     * @method exportResult
     * @param {String} projectId GoodData projectId
     * @param {String} executionResult report which should be exported
     * @param {IExportConfigRequest} exportConfig requested export options
     * @param {Object} pollingOptions for polling (maxAttempts, pollStep)
     * @return {Promise} Resolves if export successfully,
     *                   Reject if export has error (network error, api error)
     */
    public exportResult(
        projectId: string,
        executionResult: string,
        exportConfig: IExportConfigRequest = {},
        pollingOptions: IPollingOptions = {},
    ): Promise<IExportResponse> {
        const { showFilters, ...restExportConfig } = exportConfig;

        let sanitizedFilters: AFM.CompatibilityFilter[] | undefined;
        if (isArray(showFilters) && showFilters.length > 0) {
            sanitizedFilters = compact(showFilters.map(this.convertFilter));
        }

        const requestPayload: IExportResultPayload = {
            resultExport: {
                executionResult,
                exportConfig: {
                    ...restExportConfig,
                    showFilters: sanitizedFilters,
                },
            },
        };

        return this.xhr
            .post(`/gdc/internal/projects/${projectId}/exportResult`, { body: requestPayload })
            .then((response: ApiResponse) => response.getData())
            .then((data: IExportResponse) =>
                handleHeadPolling(this.xhr.get.bind(this.xhr), data.uri, this.isDataExported, pollingOptions),
            )
            .catch(this.handleExportResultError);
    }

    private handleExportResultError = (error: ApiResponseError | Error): Promise<Error> => {
        if (
            this.isApiResponseError(error) &&
            error.response.status === 400 &&
            error.responseBody.indexOf(ERROR_RESTRICTED_CODE) !== -1
        ) {
            return Promise.reject(new Error(ERROR_RESTRICTED_MESSAGE));
        }
        return Promise.reject(error);
    };

    private isDataExported(responseHeaders: Response): boolean {
        const taskState = responseHeaders.status;
        return taskState === 200 || taskState >= 400; // OK || ERROR
    }

    private isApiResponseError(error: ApiResponseError | Error): error is ApiResponseError {
        return (error as ApiResponseError).response !== undefined;
    }

    private convertFilter(filter: AFM.CompatibilityFilter): AFM.CompatibilityFilter | null {
        if ((filter as AFM.IExpressionFilter).value === undefined) {
            return convertVisualizationObjectFilter(filter as VisualizationObjectFilter);
        }
        return filter;
    }
}
