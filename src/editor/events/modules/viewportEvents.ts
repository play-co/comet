import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { Emit } from '../emitter';

export default {
    resize: Emit<void>(),
    rootChanged: Emit<DisplayObjectNode>(),
};
