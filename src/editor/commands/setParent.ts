import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { DisplayObjectModel } from '../../core/nodes/abstract/displayObjectNode';
import { ContainerNode } from '../../core/nodes/concrete/display/containerNode';
import { type UpdateMode, Command } from '../core/command';
import Events from '../events';
import { getLocalTransform } from '../ui/transform/util';
import { ModifyModelCommand } from './modifyModel';

export interface SetParentCommandParams
{
    parentId: string;
    nodeId: string;
    updateMode: UpdateMode;
    preserveTransform?: boolean;
}

export interface SetParentCommandReturn
{
    parentNode: ClonableNode;
    childNode: ClonableNode;
}

export interface SetParentCommandCache
{
    prevParentId?: string;
    modifyCommand?: ModifyModelCommand<DisplayObjectModel>;
}

export class SetParentCommand
    extends Command<SetParentCommandParams, SetParentCommandReturn, SetParentCommandCache>
{
    public static commandName = 'SetParent';

    public apply(): SetParentCommandReturn
    {
        const { datastore, params: { parentId, nodeId, updateMode, preserveTransform } } = this;

        const parentNode = this.getInstance(parentId);
        const childNode = this.getInstance(nodeId);
        const prevParentId = childNode.parent?.id;

        // cache previous parent
        this.cache.prevParentId = prevParentId;
        delete this.cache.modifyCommand;

        // remove from existing parent
        if (prevParentId)
        {
            const prevParent = this.getInstance(prevParentId);

            prevParent.removeChild(childNode);
        }

        // update datastore
        if (updateMode === 'full')
        {
            datastore.setParent(nodeId, parentId);
        }

        // update graph node
        parentNode.addChild(childNode);

        if (preserveTransform !== true && childNode.is(ContainerNode) && parentNode.is(ContainerNode))
        {
            childNode.cast<ContainerNode>().reParentTransform();
            const values = getLocalTransform(childNode.view);
            const command = new ModifyModelCommand({
                nodeId: childNode.id,
                updateMode: 'full',
                values,
            });

            this.cache.modifyCommand = command;

            command.run();
        }

        Events.datastore.node.local.reParented.emit({
            nodeId: childNode.id,
            parentId: parentNode.id,
        });

        return { parentNode, childNode };
    }

    public undo(): void
    {
        const { cache: { prevParentId, modifyCommand }, params: { parentId, nodeId, preserveTransform } } = this;

        if (modifyCommand)
        {
            modifyCommand.undo();
        }

        const parentNode = this.getInstance(parentId);
        const childNode = this.getInstance(nodeId);

        parentNode.removeChild(childNode);

        if (prevParentId)
        {
            new SetParentCommand({
                parentId: prevParentId,
                nodeId,
                updateMode: 'full',
                preserveTransform }).run();
        }
    }
}
