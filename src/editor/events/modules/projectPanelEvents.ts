import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { Emit } from '../emitter';

export default {
    setSingle: Emit<MetaNode>(),
    setMulti: Emit<MetaNode[]>(),
    add: Emit<MetaNode>(),
    remove: Emit<MetaNode>(),
    deselect: Emit<void>(),
};
