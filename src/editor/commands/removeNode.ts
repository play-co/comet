import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import { getInstance } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import Events from '../events';

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

        if (node.isCloaked)
        {
            return { node };
        }

        cache.wasSelected = false;

        if (datastore.hasNode(nodeId))
        {
            datastore.removeNode(nodeId);
        }

        node.cloak();

        if (app.selection.hierarchy.shallowContains(node.cast()))
        {
            cache.wasSelected = true;
            app.selection.hierarchy.remove(node.cast());
        }
        else if (app.selection.project.shallowContains(node.cast()))
        {
            cache.wasSelected = true;
            app.selection.project.remove(node.cast());
        }

        Events.datastore.node.local.cloaked.emit(node.cast());

        return { node: node.cast() };
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
            app.selection.hierarchy.set(node.asClonableNode());
        }

        Events.datastore.node.local.uncloaked.emit(node.cast());
    }
}
