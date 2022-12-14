import { Application } from '../../../core/application';
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

export interface TreeViewModelOptions
{
    canReParent: boolean;
    canReOrder: boolean;
    canEdit: boolean;
    allowMultiSelect: boolean;
}

export const defaultOptions: TreeViewModelOptions = {
    canReParent: true,
    canReOrder: true,
    canEdit: true,
    allowMultiSelect: true,
};

export const dblClickTimeout = 300;
export const indentationWidth = 10;

export abstract class TreeViewModel<T, S extends ItemSelection<T>>
{
    protected model: WritableStore<TreeItem<T>[]>;
    protected dragTarget: WritableStore<TreeItem<T> | undefined>;
    protected operation: WritableStore<Operation>;
    protected isEditing: WritableStore<boolean>;

    protected options: TreeViewModelOptions = { ...defaultOptions };

    protected isDragging: boolean;
    protected lastClick: number;
    protected edit?: {
        element: HTMLSpanElement;
        item: TreeItem<T>;
        originalValue: string;
    };

    constructor(
        public readonly selection: S,
        options: Partial<TreeViewModelOptions> = {},
    )
    {
        this.options = {
            ...this.options,
            ...options,
        };

        this.model = new WritableStore<TreeItem<T>[]>([]);
        this.dragTarget = new WritableStore<TreeItem<T> | undefined>(undefined);
        this.operation = new WritableStore(Operation.ReParent);
        this.isEditing = new WritableStore(false);

        this.isDragging = false;
        this.lastClick = -1;

        this.rebuildModel();
    }

    public get store()
    {
        return {
            model: this.model.store,
            dragTarget: this.dragTarget.store,
            operation: this.operation.store,
            isEditing: this.isEditing.store,
        };
    }

    public rebuildModel = () =>
    {
        if (!Application.instance.project.isReady)
        {
            return;
        }

        const model = this.generateModel();

        this.model.value = model;
    };

    protected abstract generateModel(): TreeItem<T>[];

    public abstract getId(obj: T): string;
    public abstract getLabel(obj: T): string;
    public abstract getParent(obj: T): T | undefined;
    public abstract isSiblingOf(obj: T, other: T): boolean;
    public abstract hasChildren(obj: T): boolean;

    protected getSelectedIds()
    {
        return this.selection.items.map((item) => this.getId(item));
    }

    protected hasSelectedIds(ids: string[])
    {
        return this.getSelectedIds().some((id) => ids.includes(id));
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDblClick(e: MouseEvent, item: TreeItem<T>)
    {
        // for subclasses...
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onEdit(e: MouseEvent, item: TreeItem<T>)
    {
        const element = e.target as HTMLElement;

        if (element.getAttribute('data-id') !== 'tree-view-label-edit')
        {
            return;
        }

        const span = element as HTMLSpanElement;
        const originalValue = span.innerText;

        this.edit = {
            element: span,
            item,
            originalValue,
        };
        this.isEditing.value = true;

        span.addEventListener('keydown', this.onEditKeyDown);
        span.addEventListener('blur', this.onEditBlur);

        span.style.maxWidth = `calc(100% - ${45 + (item.depth * indentationWidth)}px)`;

        setTimeout(() =>
        {
            span.focus();
        }, 0);
    }

    protected onEditKeyDown = (e: KeyboardEvent) =>
    {
        const { key } = e;

        if (this.edit)
        {
            const { edit: { element, item, originalValue } } = this;

            if (key === 'Enter')
            {
                const value = element.innerText;

                this.onEditAccept(value, item);
                this.onEditClose();
            }
            else if (key === 'Escape')
            {
                element.innerText = originalValue;
                this.onEditClose();
            }
        }
    };

    protected onEditBlur = () =>
    {
        this.onEditClose();
    };

    protected onEditClose()
    {
        if (this.edit)
        {
            const { edit: { element } } = this;

            delete this.edit;
            this.isEditing.value = false;

            element.removeEventListener('keydown', this.onEditKeyDown);
            element.blur();
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onEditAccept(value: string, item: TreeItem<T>)
    {
        // for subclasses...
    }

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

    protected selectItem(e: MouseEvent, item: TreeItem<T>): boolean
    {
        const { selection, options: { allowMultiSelect } } = this;
        const { data } = item;

        if ((e.shiftKey || e.metaKey) && allowMultiSelect)
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

        return true;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected setParent(sourceObj: T, parentObj: T)
    {
        // subclasses...
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected reorder(sourceObj: T, targetObj: T)
    {
    // subclasses...
    }

    public onRowMouseDown(event: MouseEvent, item: TreeItem<T>)
    {
        const { selection, operation, dragTarget, options: { canReOrder, canReParent } } = this;
        const existingSelection = this.getSelectedIds();

        if (event.button !== 0 || !this.selectItem(event, item))
        {
            // item was removed from selection, abort drag
            return;
        }

        this.isDragging = true;
        operation.value = Operation.ReParent;

        if (canReOrder || canReParent)
        {
            mouseDrag({ event }).then(({ event, deltaX, deltaY }) =>
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
                else
                if (deltaX === 0 && deltaY === 0 && this.hasSelectedIds(existingSelection))
                {
                    this.onEdit(event, item);
                }

                // clear drag state
                this.isDragging = false;
                this.dragTarget.value = undefined;

                if (this.lastClick > -1 && (Date.now() - this.lastClick) < dblClickTimeout && !this.isEditing.value)
                {
                    this.onDblClick(event, item);
                }

                this.lastClick = Date.now();
            });
        }
    }

    public onRowMouseOver(e: MouseEvent, item: TreeItem<T>)
    {
        const { isDragging, operation, dragTarget, selection, options: { canReParent, canReOrder } } = this;

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
        const { operation, options: { canReParent } } = this;

        return canReParent
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReParent;
    }

    public isItemReOrderDragTarget(item: TreeItem<T>, dragTarget?: TreeItem<T>)
    {
        const { operation, options: { canReOrder } } = this;

        return canReOrder
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReOrder;
    }
}
