import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { Emit } from '../emitter';

export default {
    resize: Emit<void>(),
    rootChanged: Emit<DisplayObjectNode>(),
};
