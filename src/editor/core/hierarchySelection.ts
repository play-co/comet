import type { ClonableNode } from '../../core';
import type { ModelBase } from '../../core/model/model';
import Events from '../events';
import { NodeSelection } from './nodeSelection';

export class HierarchySelection extends NodeSelection<ClonableNode>
{
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
