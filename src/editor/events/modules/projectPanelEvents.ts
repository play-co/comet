import type { NodeAsset } from '../../../core/nodes/concrete/assets/nodeAsset';
import { Emit } from '../emitter';

export default {
    selection: {
        setSingle: Emit<NodeAsset>(),
        setMulti: Emit<NodeAsset[]>(),
        add: Emit<NodeAsset>(),
        remove: Emit<NodeAsset>(),
        deselect: Emit<void>(),
    },
};
