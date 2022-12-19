import type { FocusAreaId } from '../../ui/views/components/focusArea.svelte';
import { Emit } from '../emitter';

export default {
    startDrag: Emit<{ focusAreaId: FocusAreaId; event: MouseEvent; item: unknown }>(),
    endDrag: Emit<{ focusAreaId: FocusAreaId | null; event: MouseEvent; item: unknown }>(),
};
