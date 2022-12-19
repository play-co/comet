import { getApp } from '../../../core/application';
import Events from '../../../events';
import type { FocusAreaId } from './focusArea.svelte';

export class ItemDrag
{
    protected sourceFocusAreaId: FocusAreaId | null;
    protected dragItem: unknown;

    constructor()
    {
        this.sourceFocusAreaId = null;

        const app = getApp();

        Events.mouse.up.bind((event) =>
        {
            const { sourceFocusAreaId } = this;

            if (sourceFocusAreaId)
            {
                this.sourceFocusAreaId = null;
                Events.itemDrag.endDrag.emit({ focusAreaId: app.getFocusArea(), event, item: this.dragItem });
            }
        });
    }

    public startDrag(sourceFocusAreaId: FocusAreaId, event: MouseEvent, dragItem: unknown)
    {
        this.sourceFocusAreaId = sourceFocusAreaId;
        this.dragItem = dragItem;

        Events.itemDrag.startDrag.emit({ focusAreaId: sourceFocusAreaId, event, item: dragItem });
    }

    get isDragging()
    {
        return this.sourceFocusAreaId !== null;
    }
}
