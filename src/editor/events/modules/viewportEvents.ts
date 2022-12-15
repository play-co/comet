import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { Emit } from '../emitter';

export default {
    rootChanged: Emit<DisplayObjectNode>(),
};
