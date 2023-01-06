import type { ClonableNode } from '../../core';
import Events from '../events';
import { NodeSelection } from './nodeSelection';

export class ProjectSelection extends NodeSelection<ClonableNode>
{
    protected onSetSingle(item: ClonableNode): void
    {
        Events.selection.project.setSingle.emit(item);
    }

    protected onSetMulti(items: ClonableNode[]): void
    {
        Events.selection.project.setMulti.emit(items);
    }

    protected onAdd(item: ClonableNode): void
    {
        Events.selection.project.add.emit(item);
    }

    protected onRemove(item: ClonableNode): void
    {
        Events.selection.project.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.selection.project.deselect.emit();
    }
}
