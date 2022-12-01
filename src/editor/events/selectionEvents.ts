import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';

export interface SelectionEvent
{
    'selection.set.single': DisplayObjectNode;
    'selection.set.multi': DisplayObjectNode[];
    'selection.add': DisplayObjectNode;
    'selection.remove': DisplayObjectNode;
    'selection.deselect': void[];
}
