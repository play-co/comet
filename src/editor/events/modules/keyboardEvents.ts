import { Emit } from '../emitter';

export default {
    down: Emit<KeyboardEvent>(),
    up: Emit<KeyboardEvent>(),
};
