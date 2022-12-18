import type { ModalDialogId } from '../../ui/views/components/modalDialog.svelte';
import { Emit } from '../emitter';

export default {
    modal: {
        open: Emit<ModalDialogId>(),
        close: Emit<void>(),
    },
};
