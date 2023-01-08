import { Emit } from '../emitter';

export default {
    global: Emit<ErrorEvent>(),
    unhandledrejection: Emit<PromiseRejectionEvent>(),
};
