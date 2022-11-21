import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import { getInstance } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';

export interface RemoveNodeCommandParams
{
    nodeId: string;
}

export interface RemoveNodeCommandReturn
{
    node: ClonableNode;
}

export interface RemoveNodeCommandCache
{
    wasSelected: boolean;
}

export class RemoveNodeCommand
    extends Command<RemoveNodeCommandParams, RemoveNodeCommandReturn, RemoveNodeCommandCache>
{
    public static commandName = 'RemoveNode';

    public apply(): RemoveNodeCommandReturn
    {
        const { app, datastore, params: { nodeId }, cache } = this;

        const node = getInstance<ClonableNode>(nodeId);

        cache.wasSelected = false;

        if (datastore.hasNode(nodeId))
        {
            datastore.removeNode(nodeId);
        }

        node.cloak();

        if (node instanceof DisplayObjectNode && app.selection.deepContains(node.cast<DisplayObjectNode>()))
        {
            cache.wasSelected = true;
            if (app.selection.shallowContains(node))
            {
                app.selection.remove(node);
            }
        }

        return { node: node.cast<ClonableNode>() };
    }

    public undo()
    {
        const { app, cache, datastore, params: { nodeId } } = this;

        const node = getInstance<ClonableNode>(nodeId);
        const nodeSchema = getNodeSchema(node);

        if (!datastore.hasNode(nodeId))
        {
            datastore.createNode(nodeSchema);
        }

        node.uncloak();

        if (node instanceof DisplayObjectNode && cache.wasSelected)
        {
            app.selection.add(node);
        }
    }
}
