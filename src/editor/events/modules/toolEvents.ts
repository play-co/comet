import type { Tool } from '../../core/tool';
import { Emit } from '../emitter';

export default {
    select: Emit<Tool>(),
    deselect: Emit<Tool>(),
};
