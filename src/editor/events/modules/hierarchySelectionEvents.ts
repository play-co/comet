import type { ClonableNode } from '../../../core';
import { Emit } from '../emitter';

export default {
    setSingle: Emit<ClonableNode>(),
    setMulti: Emit<ClonableNode[]>(),
    add: Emit<ClonableNode>(),
    remove: Emit<ClonableNode>(),
    deselect: Emit<void>(),
};
