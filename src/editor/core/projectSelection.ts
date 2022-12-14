import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class ProjectSelection extends ItemSelection<MetaNode>
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public deepContains(node: MetaNode)
    {
        // TODO...
        console.log('@!@#!#!@#');

        return false;
    }

    protected onSetSingle(item: MetaNode): void
    {
        Events.selection.project.setSingle.emit(item);
    }

    protected onSetMulti(items: MetaNode[]): void
    {
        Events.selection.project.setMulti.emit(items);
    }

    protected onAdd(item: MetaNode): void
    {
        Events.selection.project.add.emit(item);
    }

    protected onRemove(item: MetaNode): void
    {
        Events.selection.project.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.selection.project.deselect.emit();
    }
}
