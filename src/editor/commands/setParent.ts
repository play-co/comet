import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Command } from '../core/command';

export interface SetParentCommandParams
{
    parentId: string;
    nodeId: string;
}

export interface SetParentCommandReturn
{
    parentNode: ClonableNode;
    childNode: ClonableNode;
}

export interface SetParentCommandCache
{
    prevParentId?: string;
}

export class SetParentCommand
    extends Command<SetParentCommandParams, SetParentCommandReturn, SetParentCommandCache>
{
    public static commandName = 'SetParent';

    public apply(): SetParentCommandReturn
    {
        const { datastore, params: { parentId, nodeId } } = this;

        const parentNode = this.getInstance(parentId);
        const childNode = this.getInstance(nodeId);
        const prevParentId = childNode.parent?.id;

        // cache previous parent
        this.cache.prevParentId = prevParentId;

        // remove from existing parent
        if (prevParentId)
        {
            const prevParent = this.getInstance(prevParentId);

            prevParent.removeChild(childNode);
        }

        // update datastore
        datastore.setNodeParent(nodeId, parentId);

        // update graph node
        parentNode.addChild(childNode);

        // update worldTransform
        const viewMatrix = childNode.view.worldTransform.clone();
        const parentMatrix = childNode.view.parent.worldTransform.clone();

        viewMatrix.prepend(parentMatrix.invert());
        childNode.view.transform.setFromMatrix(viewMatrix);

        return { parentNode, childNode };
    }

    public undo(): void
    {
        const { cache: { prevParentId }, params: { parentId, nodeId } } = this;

        const parentNode = this.getInstance(parentId);
        const childNode = this.getInstance(nodeId);

        parentNode.removeChild(childNode);

        if (prevParentId)
        {
            new SetParentCommand({ parentId: prevParentId, nodeId }).run();
        }
    }
}
