import type { ClonableNode } from '../../core';
import type { ModelBase } from '../../core/model/model';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class NodeSelection extends ItemSelection<ClonableNode>
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
        Events.selection.setSingle.emit(item);
    }

    protected onSetMulti(items: ClonableNode<ModelBase, object>[]): void
    {
        Events.selection.setMulti.emit(items);
    }

    protected onAdd(item: ClonableNode<ModelBase, object>): void
    {
        Events.selection.add.emit(item);
    }

    protected onRemove(item: ClonableNode<ModelBase, object>): void
    {
        Events.selection.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.selection.deselect.emit();
    }
}
