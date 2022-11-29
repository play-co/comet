import { type UpdateMode, Command } from '../core/command';

export interface SetNodeIndexCommandParams
{
    nodeId: string;
    index: number;
    updateMode: UpdateMode;
}

export interface SetNodeIndexCommandCache
{
    prevIndex: number;
}

export class SetNodeIndexCommand
    extends Command<SetNodeIndexCommandParams, void, SetNodeIndexCommandCache>
{
    public static commandName = 'SetNodeIndex';

    public apply(): void
    {
        const { datastore, params: { nodeId, index, updateMode } } = this;

        const sourceNode = this.getInstance(nodeId);
        const parentId = sourceNode.parent?.id;

        if (parentId)
        {
            const parentNode = this.getInstance(parentId);

            parentNode.setChildIndex(sourceNode, index);
        }

        if (updateMode === 'full')
        {
            //
        }
    }

    public undo(): void
    {
        //
    }
}
