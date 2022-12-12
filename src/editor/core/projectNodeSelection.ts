import type { NodeAsset } from '../../core/nodes/concrete/assets/nodeAsset';
import Events from '../events';
import { ItemSelection } from './itemSelection';

export class ProjectNodeSelection extends ItemSelection<NodeAsset>
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public deepContains(node: NodeAsset)
    {
        return false;
    }

    protected onSetSingle(item: NodeAsset): void
    {
        Events.projectPanel.selection.setSingle.emit(item);
    }

    protected onSetMulti(items: NodeAsset[]): void
    {
        Events.projectPanel.selection.setMulti.emit(items);
    }

    protected onAdd(item: NodeAsset): void
    {
        Events.projectPanel.selection.add.emit(item);
    }

    protected onRemove(item: NodeAsset): void
    {
        Events.projectPanel.selection.remove.emit(item);
    }

    protected onDeselect(): void
    {
        Events.projectPanel.selection.deselect.emit();
    }
}
