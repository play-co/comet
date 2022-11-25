import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';

export interface ViewportEvent
{
    'viewport.resize': void;
    'viewport.root.changed': DisplayObjectNode;
}
