import type { ItemSelection } from '../../../core/itemSelection';
import { mouseDrag } from '../../components/dragger';
import { WritableStore } from '../store';

export interface TreeItem<T>
{
    id: string;
    data: T;
    depth: number;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
    icon?: string;
}

export enum Operation
    {
    ReParent,
    ReOrder,
}

export abstract class TreeViewModel<T>
{
    protected model: WritableStore<TreeItem<T>[]>;
    protected dragTarget: WritableStore<TreeItem<T> | undefined>;
    protected operation: WritableStore<Operation>;
    protected isDragging: boolean;

    public canReParent: boolean;
    public canReOrder: boolean;

    constructor(public readonly selection: ItemSelection<T>)
    {
        this.model = new WritableStore<TreeItem<T>[]>([]);
        this.dragTarget = new WritableStore<TreeItem<T> | undefined>(undefined);
        this.operation = new WritableStore<Operation>(Operation.ReParent);
        this.isDragging = false;
        this.canReParent = true;
        this.canReOrder = true;
    }

    public get store()
    {
        return {
            model: this.model.store,
            dragTarget: this.dragTarget.store,
            operation: this.operation.store,
        };
    }

    public rebuildModel = () =>
    {
        const model = this.generateModel();

        this.model.value = model;
    };

    protected abstract generateModel(): TreeItem<T>[];

    public abstract getId(obj: T): string;
    public abstract getLabel(obj: T): string;
    public abstract getParent(obj: T): T | undefined;
    public abstract isSiblingOf(obj: T, other: T): boolean;
    public abstract hasChildren(obj: T): boolean;

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
        if (e.button !== 0 || this.selectItem(e, item) === false)
        {
            // item was removed from selection, abort drag
            return;
        }

        const { selection, operation, dragTarget, canReOrder, canReParent } = this;

        this.isDragging = true;
        operation.value = Operation.ReParent;

        if (canReOrder || canReParent)
        {
            mouseDrag(e).then(() =>
            {
                const dragTargetValue = dragTarget.value;

                if (dragTargetValue)
                {
                    const dragTargetObj = dragTargetValue.data;

                    selection.forEach((item) =>
                    {
                        const sourceObj = item;

                        if (canReParent && (operation.value === Operation.ReParent))
                        {
                            // re-parent
                            const parentId = dragTargetValue.id;
                            const parent = this.getParent(sourceObj);

                            if (parent && parentId !== this.getId(parent))
                            {
                                this.setParent(sourceObj, dragTargetObj);
                            }
                        }
                        else if (canReOrder)
                        {
                            // re-order
                            const sourceObj = selection.items[0];
                            const targetObj = dragTargetObj;

                            this.reorder(sourceObj, targetObj);
                        }

                        this.rebuildModel();
                    });
                }

                // clear drag state
                this.isDragging = false;
                this.dragTarget.value = undefined;
            });
        }
    }

    public onRowMouseOver(e: MouseEvent, item: TreeItem<T>)
    {
        const { isDragging, operation, dragTarget, selection, canReParent, canReOrder } = this;

        if (isDragging && (canReParent || canReOrder))
        {
            const targetElement = e.target as HTMLElement;

            operation.value = e.currentTarget === e.target || targetElement.classList.contains('arrow')
                ? Operation.ReOrder
                : Operation.ReParent;

            if (canReOrder && (operation.value === Operation.ReOrder))
            {
                // re-ordering
                const isSibling = this.isSiblingOf(item.data, selection.items[0]);

                isSibling || item.data === this.getParent(selection.items[0])
                    ? dragTarget.value = item
                    : dragTarget.value = undefined;
            }
            else if (canReParent)
            {
                // re-parenting
                selection.shallowContains(item.data)
                    ? dragTarget.value = undefined
                    : dragTarget.value = item;
            }
        }
    }

    public doesSelectionContainItem(item: TreeItem<T>)
    {
        return this.selection.shallowContains(item.data);
    }

    public isItemReParentDragTarget(item: TreeItem<T>, dragTarget?: TreeItem<T>)
    {
        const { operation, canReParent } = this;

        return canReParent
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReParent;
    }

    public isItemReOrderDragTarget(item: TreeItem<T>, dragTarget?: TreeItem<T>)
    {
        const { operation, canReOrder } = this;

        return canReOrder
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReOrder;
    }
}
