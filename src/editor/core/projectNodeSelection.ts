import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class ProjectNodeSelection extends ItemSelection<MetaNode>
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public deepContains(node: MetaNode)
    {
        // TODO...
        debugger;

        return false;
    }

    protected onSetSingle(item: MetaNode): void
    {
        Events.projectPanel.selection.setSingle.emit(item);
    }

    protected onSetMulti(items: MetaNode[]): void
    {
        Events.projectPanel.selection.setMulti.emit(items);
    }

    protected onAdd(item: MetaNode): void
    {
        Events.projectPanel.selection.add.emit(item);
    }

    protected onRemove(item: MetaNode): void
    {
        Events.projectPanel.selection.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.projectPanel.selection.deselect.emit();
    }
}
