import { Emit } from '../emitter';

export default {
    create: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<Error>(),
    },
    open: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<Error>(),
    },
    delete: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<Error>(),
    },
    ready: Emit<void>(),
};
