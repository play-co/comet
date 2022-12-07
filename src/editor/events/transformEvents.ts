import type { TransformGizmo } from '../ui/transform/gizmo';

export interface TransformEvent
{
    'transform.start': TransformGizmo;
    'transform.modify': TransformGizmo;
    'transform.end': TransformGizmo;
}
