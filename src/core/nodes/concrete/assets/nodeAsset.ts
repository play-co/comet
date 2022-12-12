import type { GraphNode } from '../../abstract/graphNode';
import { Asset } from './asset';

export abstract class NodeAsset<NodeType extends GraphNode = GraphNode> extends Asset
{
    public nodeId: string;

    constructor(id: string | undefined, name: string, nodeId: string)
    {
        super(id, name);

        this.nodeId = nodeId;
    }

    public abstract getNode(): NodeType;
}
