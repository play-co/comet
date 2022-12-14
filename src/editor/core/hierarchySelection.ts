import type { ClonableNode } from '../../core';
import type { ModelBase } from '../../core/model/model';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class HierarchySelection extends ItemSelection<ClonableNode>
{
    public deepContains(node: ClonableNode)
    {
        const allNodes: Map<ClonableNode, true> = new Map();

        this.items.forEach((selectedNode) =>
        {
            selectedNode.walk<ClonableNode>((node) =>
            {
                allNodes.set(node, true);
            });
        });

        return allNodes.has(node);
    }

    protected onSetSingle(item: ClonableNode<ModelBase, object>): void
    {
        Events.selection.hierarchy.setSingle.emit(item);
    }

    protected onSetMulti(items: ClonableNode<ModelBase, object>[]): void
    {
        Events.selection.hierarchy.setMulti.emit(items);
    }

    protected onAdd(item: ClonableNode<ModelBase, object>): void
    {
        Events.selection.hierarchy.add.emit(item);
    }

    protected onRemove(item: ClonableNode<ModelBase, object>): void
    {
        Events.selection.hierarchy.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.selection.hierarchy.deselect.emit();
    }
}
