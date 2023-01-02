import type { DisplayObject } from 'pixi.js';

import type { UpdateMode } from '../../core/command';
import { yellowPivot } from './util';

export interface TransformGizmoConfig
{
    showEncompassingBorder: boolean;
    showTransformBorder: boolean;
    showPrimaryHandles: boolean;
    showSecondaryHandles: boolean;
    showPivot: boolean;
    enablePivotTranslation: boolean;
    enableTranslation: boolean;
    enableRotation: boolean;
    enableScaling: boolean;
    defaultScaleMode: 'edge' | 'pivot';
    pivotView: DisplayObject;
    handlePrimarySize: number;
    handleSecondarySize: number;
    updateMode: UpdateMode;
}

export const defaultFullTransformGizmoConfig: Omit<TransformGizmoConfig, 'container'> = {
    showEncompassingBorder: true,
    showTransformBorder: true,
    showPrimaryHandles: true,
    showSecondaryHandles: true,
    showPivot: true,
    enablePivotTranslation: true,
    enableTranslation: true,
    enableRotation: true,
    enableScaling: true,
    defaultScaleMode: 'edge',
    pivotView: yellowPivot,
    handlePrimarySize: 5,
    handleSecondarySize: 4,
    updateMode: 'full',
};

export const defaultSelectTransformGizmoConfig: Omit<TransformGizmoConfig, 'container'> = {
    showEncompassingBorder: false,
    showTransformBorder: true,
    showPrimaryHandles: false,
    showSecondaryHandles: false,
    showPivot: false,
    enablePivotTranslation: false,
    enableTranslation: false,
    enableRotation: false,
    enableScaling: false,
    defaultScaleMode: 'edge',
    pivotView: yellowPivot,
    handlePrimarySize: 5,
    handleSecondarySize: 4,
    updateMode: 'full',
};
