// (C) 2007-2019 GoodData Corporation
import { IGuidColorItem, IRGBColorItem, IColorItem } from './interfaces';

export const isGuidColorItem = (color: IColorItem): color is IGuidColorItem => color.type === 'guid';
export const isRgbColorItem = (color: IColorItem): color is IRGBColorItem => color.type === 'rgb';
