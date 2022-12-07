import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { Emit } from '../emitter';

export default {
    setSingle: Emit<DisplayObjectNode>(),
    setMulti: Emit<DisplayObjectNode[]>(),
    add: Emit<DisplayObjectNode>(),
    remove: Emit<DisplayObjectNode>(),
    deselect: Emit<void>(),
};
