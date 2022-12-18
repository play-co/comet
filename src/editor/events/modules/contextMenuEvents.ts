import { Emit } from '../emitter';

export default {
    open: Emit<MouseEvent>(),
    close: Emit<void>(),
};
