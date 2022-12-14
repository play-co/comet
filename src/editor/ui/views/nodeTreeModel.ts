import type { ClonableNode } from '../../../core';
import type { ItemSelection } from '../../core/itemSelection';
import { TreeViewModel } from './components/treeView';

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
        return obj.hasChildren;
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
}
