import type { ItemSelection } from '../../core/itemSelection';
import { mouseDrag } from '../components/dragger';
import { WritableStore } from './store';

export interface TreeItem<T>
{
    data: T;
    depth: number;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
}

export enum Operation
    {
    ReParent,
    ReOrder,
}

export type BasicNode<T> = {
    id: string;
    parent?: T;
    isSiblingOf: (node: T) => boolean;
};

export abstract class TreeModel<T extends BasicNode<T>>
{
    public model: WritableStore<TreeItem<T>[]>;
    public isDragging: WritableStore<boolean>;
    public dragTarget: WritableStore<TreeItem<T> | undefined>;
    public operation: WritableStore<Operation>;

    constructor(public readonly selection: ItemSelection<T>)
    {
        this.model = new WritableStore<TreeItem<T>[]>([]);
        this.isDragging = new WritableStore<boolean>(false);
        this.dragTarget = new WritableStore<TreeItem<T> | undefined>(undefined);
        this.operation = new WritableStore<Operation>(Operation.ReParent);
    }

    protected rebuildModel()
    {
        this.model.value = this.generateModel();
    }

    protected abstract generateModel(): TreeItem<T>[];

    protected updateModel(fn: (item: TreeItem<T>) => void)
    {
        this.model.value.forEach(fn);
        this.model.value = [...this.model.value];
    }

    public toggleItemExpanded(e: MouseEvent, item: TreeItem<T>)
    {
        const { model } = this;
        const index = model.value.indexOf(item);

        item.isExpanded = !item.isExpanded;

        for (let i = index + 1; i <= model.value.length - 1; i++)
        {
            const subItem = model.value[i];

            if (subItem.depth > item.depth)
            {
                subItem.isVisible = item.isExpanded;
            }
            else if (subItem.depth <= item.depth)
            {
                break;
            }
        }

        item.isVisible = true;

        e.stopPropagation();

        model.value = [...model.value];
    }

    protected selectItem(e: MouseEvent, item: TreeItem<T>): undefined | false
    {
        const { selection } = this;
        const { data } = item;

        if (e.shiftKey || e.metaKey)
        {
            if (selection.shallowContains(data))
            {
            // remove from selection
                selection.remove(data);

                return false;
            }
            // add to selection
            selection.add(data);
        }
        else if (!selection.shallowContains(data))
        {
            // replace selection if not already selected
            selection.set(data);
        }

        return undefined;
    }

    protected abstract setParent(sourceObj: T, parentObj: T): void;
    protected abstract reorder(sourceObj: T, targetObj: T): void;

    public onRowMouseDown(e: MouseEvent, item: TreeItem<T>)
    {
        if (this.selectItem(e, item) === false)
        {
            // item was removed from selection, abort drag
            return;
        }

        const { selection, isDragging, operation, dragTarget } = this;

        isDragging.value = true;
        operation.value = Operation.ReParent;

        mouseDrag(e).then(() =>
        {
            if (isDragging.value && dragTarget.value)
            {
                const dragTargetObj = dragTarget.value.data;

                selection.forEach((item) =>
                {
                    const sourceObj = item;

                    if (operation.value === Operation.ReParent)
                    {
                        // re-parent
                        const parentId = dragTargetObj.id;

                        if (sourceObj.parent && parentId !== sourceObj.parent.id)
                        {
                            this.setParent(sourceObj, dragTargetObj);
                        }
                    }
                    else
                    {
                        // re-order
                        const sourceObj = selection.items[0];
                        const targetObj = dragTargetObj;

                        this.reorder(sourceObj, targetObj);
                    }

                    this.rebuildModel();
                });
            }

            this.clearDrag();
        });
    }

    public onRowMouseOver(e: MouseEvent, item: TreeItem<T>)
    {
        const { isDragging, operation, dragTarget, selection } = this;

        if (isDragging.value)
        {
            const targetElement = e.target as HTMLElement;

            operation.value = e.currentTarget === e.target || targetElement.classList.contains('arrow')
                ? Operation.ReOrder
                : Operation.ReParent;

            if (operation.value === Operation.ReOrder)
            {
                // re-ordering
                item.data.isSiblingOf(selection.items[0]) || item.data === selection.items[0].parent
                    ? dragTarget.value = item
                    : dragTarget.value = undefined;
            }
            else
            {
                // re-parenting
                selection.shallowContains(item.data)
                    ? dragTarget.value = undefined
                    : dragTarget.value = item;
            }
        }
    }

    protected clearDrag()
    {
        this.isDragging.value = false;
        this.dragTarget.value = undefined;
    }

    public doesSelectionContainItem(item: TreeItem<T>)
    {
        return this.selection.shallowContains(item.data);
    }
}
