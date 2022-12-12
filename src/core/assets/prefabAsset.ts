import { ClonableNode } from '../nodes/abstract/clonableNode';
import { getInstance } from '../nodes/instances';
import type { NodeAssetSchema } from '../nodes/schema';
import { NodeAsset } from './nodeAsset';

export class PrefabAsset extends NodeAsset<ClonableNode>
{
    public static fromSchema(schema: NodeAssetSchema)
    {
        const { id, nodeId, name } = schema;

        return new PrefabAsset(id, name, nodeId);
    }

    public getNode()
    {
        const node = getInstance(this.nodeId);

        if (node instanceof ClonableNode)
        {
            return node;
        }

        throw new Error(`Node with id ${this.nodeId} is not a ClonableNode`);
    }
}
