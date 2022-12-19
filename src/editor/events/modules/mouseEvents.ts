import { Emit } from '../emitter';

export default {
    down: Emit<MouseEvent>(),
    up: Emit<MouseEvent>(),
    move: Emit<MouseEvent>(),
};
