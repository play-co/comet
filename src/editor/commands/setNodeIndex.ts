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
        const { datastore, params: { nodeId, index, updateMode }, cache } = this;

        const sourceNode = this.getInstance(nodeId);
        const parentId = sourceNode.parent?.id;

        if (parentId)
        {
            const parentNode = this.getInstance(parentId);

            cache.prevIndex = parentNode.children.indexOf(sourceNode);

            parentNode.setChildIndex(sourceNode, index);
        }

        if (updateMode === 'full')
        {
            datastore.setNodeIndex(nodeId, index);
        }
    }

    public undo(): void
    {
        const { datastore, params: { nodeId, updateMode }, cache } = this;

        const sourceNode = this.getInstance(nodeId);
        const parentId = sourceNode.parent?.id;

        if (parentId)
        {
            const parentNode = this.getInstance(parentId);

            parentNode.setChildIndex(sourceNode, cache.prevIndex + 1);
        }

        if (updateMode === 'full')
        {
            datastore.setNodeIndex(nodeId, cache.prevIndex + 1);
        }
    }
}
