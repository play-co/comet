import type { ModalDialogId } from '../../ui/views/components/modalDialog';
import { Emit } from '../emitter';

export default {
    modal: {
        open: Emit<ModalDialogId>(),
        close: Emit<void>(),
    },
};
