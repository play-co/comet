import type { Command } from '../../core/command';
import { Emit } from '../emitter';

export default {
    exec: Emit<Command>(),
    run: Emit<Command>(),
    undo: Emit<Command>(),
    redo: Emit<Command>(),
};
