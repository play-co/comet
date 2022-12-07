import { Emit } from '../emitter';

export default {
    create: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<void>(),
    },
    open: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<void>(),
    },
    delete: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<void>(),
    },
    ready: Emit<void>(),
};
