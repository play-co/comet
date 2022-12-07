import type { TransformGizmo } from '../../ui/transform/gizmo';
import { Emit } from '../emitter';

export default {
    start: Emit<TransformGizmo>(),
    modify: Emit<TransformGizmo>(),
    end: Emit<TransformGizmo>(),
};
