import type { ClonableNode } from '../../core';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class ProjectSelection extends ItemSelection<ClonableNode>
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public deepContains(node: MetaNode)
    {
        // TODO...
        console.log('@!@#!#!@#');

        return false;
    }

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
