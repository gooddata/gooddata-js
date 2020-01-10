// (C) 2007-2020 GoodData Corporation
import { IGuidColorItem, IRGBColorItem, IColorItem } from "./interfaces";
import { ApiExecutionResponseError } from "./execution/execute-afm";

const isValidColorItem = (value: IColorItem | undefined | null): value is IColorItem =>
    !!(value && value.type && value.value !== undefined);

export const isGuidColorItem = (color: IColorItem | undefined | null): color is IGuidColorItem =>
    isValidColorItem(color) && color.type === "guid";
export const isRgbColorItem = (color: IColorItem | undefined | null): color is IRGBColorItem =>
    isValidColorItem(color) && color.type === "rgb";

export function isApiExecutionResponseError(error: Error): error is ApiExecutionResponseError {
    return !!(error as ApiExecutionResponseError).executionResponse;
}
