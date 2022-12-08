import type { ClonableNode } from '../../core';
import { Command } from '../core/command';

export interface AddSelectionCommandParams
{
    nodeId: string;
}

export class AddSelectionCommand
    extends Command<AddSelectionCommandParams>
{
    public static commandName = 'SetCustomProp';

    public apply(): void
    {
        const { app, params: { nodeId } } = this;

        const node = this.getInstance<ClonableNode>(nodeId);

        app.selection.add(node);
    }

    public undo(): void
    {
        const { app, params: { nodeId } } = this;

        const node = this.getInstance<ClonableNode>(nodeId);

        app.selection.remove(node);
    }
}
