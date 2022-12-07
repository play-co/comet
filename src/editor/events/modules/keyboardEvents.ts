import { Emit } from '../emitter';

export default {
    keyDown: Emit<KeyboardEvent>(),
    keyUp: Emit<KeyboardEvent>(),
};
