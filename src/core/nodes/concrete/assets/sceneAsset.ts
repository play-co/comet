import { SceneNode } from '../sceneNode';
import { getInstance } from '../../instances';
import type { NodeAssetSchema } from '../../schema';
import { NodeAsset } from './nodeAsset';

export class SceneAsset extends NodeAsset<SceneNode>
{
    public static fromSchema(schema: NodeAssetSchema)
    {
        const { id, nodeId, name } = schema;

        return new SceneAsset(id, name, nodeId);
    }

    public getNode()
    {
        const node = getInstance(this.nodeId);

        if (node instanceof SceneNode)
        {
            return node;
        }

        throw new Error(`Node with id ${this.nodeId} is not a SceneNode`);
    }
}
