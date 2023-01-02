import type { ClonableNode } from '../../../../core';
import { ModifyModelCommand } from '../../../commands/modifyModel';
import { SetNodeIndexCommand } from '../../../commands/setNodeIndex';
import { SetParentCommand } from '../../../commands/setParent';
import { Application, getApp } from '../../../core/application';
import type { ItemSelection } from '../../../core/itemSelection';
import { type TreeItem, TreeViewModel } from './treeModel';

export abstract class NodeTreeModel<
    NodeSelectionType extends ItemSelection<ClonableNode>,
> extends TreeViewModel<ClonableNode, NodeSelectionType>
{
    public getLabel(obj: ClonableNode)
    {
        return obj.model.getValue<string>('name');
    }

    public getId(obj: ClonableNode)
    {
        return obj.id;
    }

    public getParent(obj: ClonableNode)
    {
        return obj.parent as (ClonableNode | undefined);
    }

    public isSiblingOf(
        obj: ClonableNode,
        other: ClonableNode,
    )
    {
        return obj.isSiblingOf(other);
    }

    public hasChildren(obj: ClonableNode)
    {
        return obj.getChildren<ClonableNode>().filter((node) => !node.isCloaked).length > 0;
    }

    public onSelectionChanged = () =>
    {
        this.updateModel((item) =>
        {
            item.isSelected = this.selection.shallowContains(item.data);
        });
    };

    public onDeselect = () =>
    {
        this.updateModel((item) =>
        {
            item.isSelected = false;
        });
    };

    protected setParent(
        sourceObj: ClonableNode,
        parentObj: ClonableNode,
    )
    {
        const nodeId = sourceObj.id;
        const parentId = parentObj.id;

        if (sourceObj.parent && parentId !== sourceObj.parent.id)
        {
            Application.instance.undoStack.exec(
                new SetParentCommand({
                    nodeId,
                    parentId,
                    updateMode: 'full',
                }),
            );
        }
    }

    protected getReOrderIndex(
        sourceObj: ClonableNode,
        targetObj: ClonableNode,
    )
    {
        const parentNode = targetObj === sourceObj.parent
            ? targetObj
            : (targetObj.parent as ClonableNode);

        const index = targetObj === sourceObj.parent
            ? 0
            : parentNode.indexOf(targetObj, true) + 1;

        if (index !== sourceObj.index && sourceObj !== targetObj)
        {
            return index;
        }

        return -1;
    }

    protected reorder(
        sourceObj: ClonableNode,
        targetObj: ClonableNode,
    )
    {
        const index = this.getReOrderIndex(sourceObj, targetObj);

        if (index > -1)
        {
            Application.instance.undoStack.exec(
                new SetNodeIndexCommand({
                    nodeId: sourceObj.id,
                    index,
                    updateMode: 'full',
                }),
            );
        }
    }

    protected canReParentTarget(target: TreeItem<ClonableNode>)
    {
        const sourceNode = this.selection.firstItem;
        const targetNode = target.data;

        return targetNode !== sourceNode.parent
            && !sourceNode.contains(targetNode);

        return false;
    }

    protected onEditAccept(value: string, item: TreeItem<ClonableNode>)
    {
        Application.instance.undoStack.exec(
            new ModifyModelCommand({
                nodeId: item.data.id,
                values: {
                    name: value,
                },
                updateMode: 'full',
            }),
        );
    }

    protected onHintReOrderTarget(sourceObject: ClonableNode, targetObject: ClonableNode | undefined): void
    {
        const app = getApp();
        const sourceName = sourceObject.model.getValue<string>('name');

        if (targetObject)
        {
            const targetName = targetObject ? targetObject.model.getValue<string>('name') : '';

            app.statusBar.setMessage(targetObject ? `Reorder <${sourceName}> under <${targetName}>` : '');
        }
        else
        {
            app.statusBar.clearMessage();
        }
    }

    protected onHintReParentTarget(sourceObject: ClonableNode, targetObject: ClonableNode | undefined): void
    {
        const app = getApp();
        const sourceName = sourceObject.model.getValue<string>('name');

        if (targetObject)
        {
            const targetName = targetObject ? targetObject.model.getValue<string>('name') : '';

            app.statusBar.setMessage(targetObject ? `Reparent <${sourceName}> to <${targetName}>` : '');
        }
        else
        {
            app.statusBar.clearMessage();
        }
    }
}
