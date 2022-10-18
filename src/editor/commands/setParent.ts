console.log('SETPARENT');
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

        // cache previous parent
        this.cache.prevParentId = childNode.parent?.id;

        // update datastore
        datastore.setNodeParent(nodeId, parentId);

        // update graph node
        parentNode.addChild(childNode);

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
