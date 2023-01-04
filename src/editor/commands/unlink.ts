import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { sortNodesByDepth } from '../../core/nodes/const';
import { type NodeSchema, getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';

export interface UnlinkCommandParams
{
    nodeId: string;
}

export interface UnlinkCommandCache
{
    nodes: NodeSchema[];
}

export class UnlinkCommand
    extends Command<UnlinkCommandParams, void, UnlinkCommandCache>
{
    public static commandName = 'Unlink';

    public apply(): void
    {
        const { datastore, params: { nodeId }, cache } = this;

        const node = this.getInstance(nodeId);

        // write cache first
        cache.nodes = [];
        node.walk<ClonableNode>((node) => cache.nodes.push(getNodeSchema(node)));

        // unlink node sub tree
        node.walk<ClonableNode>((node) =>
        {
            const nodeId = node.id;

            // unlink graph node
            node.unlink();

            // update datastore with new cloneInfo and model values
            datastore.updateCloneInfo(nodeId, getCloneInfoSchema(node));
            datastore.modifyModel(nodeId, node.model.ownValues);
        });
    }

    public undo(): void
    {
        const { datastore, cache: { nodes } } = this;

        for (const nodeSchema of nodes)
        {
            const node = this.getInstance(nodeSchema.id);
            const cloner = nodeSchema.cloneInfo.cloner ? this.getInstance(nodeSchema.cloneInfo.cloner) : undefined;
            const nodeSchemaCloneInfo = CloneInfo.fromSchema(nodeSchema.cloneInfo);

            // update cloners cloned info
            if (cloner)
            {
                cloner.cloneInfo.cloned.push(node);
                sortNodesByDepth(cloner.cloneInfo.cloned as ClonableNode[]);

                // references need to use the cloners exact model
                if (nodeSchemaCloneInfo.isReference)
                {
                    node.model = cloner.model;
                }
                else if (nodeSchemaCloneInfo.isInstanceRoot)
                {
                    node.model.link(cloner.model);
                }
            }

            // update nodes cloneInfo
            node.cloneInfo.cloner = cloner;
            node.cloneInfo.cloneMode = nodeSchema.cloneInfo.cloneMode;
            node.cloneInfo.cloned = nodeSchema.cloneInfo.cloned.map((id) => this.getInstance(id));

            // update datastore
            datastore.updateCloneInfo(nodeSchema.id, getCloneInfoSchema(node));
        }
    }
}
