import type { ClonableNode } from '../../../../core';
import { nextTick } from '../../../../core/util';
import { Application, getApp } from '../../../core/application';
import type { NodeSelection } from '../../../core/nodeSelection';
import Events from '../../../events';
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

export abstract class TreeViewModel<ItemType extends ClonableNode, SelectionType extends NodeSelection<ItemType> = NodeSelection<ItemType>>
{
    protected model: WritableStore<TreeItem<ItemType>[]>;
    protected dragTarget: WritableStore<TreeItem<ItemType> | undefined>;
    protected operation: WritableStore<Operation>;
    protected isEditing: WritableStore<boolean>;

    protected options: TreeViewModelOptions = { ...defaultOptions };

    protected isDragging: boolean;
    protected lastClick: number;
    protected edit?: {
        element: HTMLSpanElement;
        item: TreeItem<ItemType>;
        originalValue: string;
    };

    protected isMouseOver: boolean;

    constructor(
        public readonly selection: SelectionType,
        options: Partial<TreeViewModelOptions> = {},
    )
    {
        this.options = {
            ...this.options,
            ...options,
        };

        this.model = new WritableStore<TreeItem<ItemType>[]>([]);
        this.dragTarget = new WritableStore<TreeItem<ItemType> | undefined>(undefined);
        this.operation = new WritableStore(Operation.ReParent);
        this.isEditing = new WritableStore(false);

        this.isDragging = false;
        this.lastClick = -1;
        this.isMouseOver = false;

        Events.key.down.bind(this.onKeyDown);

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

    protected abstract generateModel(): TreeItem<ItemType>[];

    public abstract getId(obj: ItemType): string;
    public abstract getLabel(obj: ItemType): string;
    public abstract getParent(obj: ItemType): ItemType | undefined;
    public abstract isSiblingOf(obj: ItemType, other: ItemType): boolean;
    public abstract hasChildren(obj: ItemType): boolean;

    protected getSelectedIds()
    {
        return this.selection.items.map((item) => this.getId(item));
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDblClick(e: MouseEvent, item: TreeItem<ItemType>)
    {
        // for subclasses...
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onEditOpen(e: MouseEvent, item: TreeItem<ItemType>)
    {
        const element = e.target as HTMLElement;

        if (element.getAttribute('data-id') !== 'tree-view-label-edit')
        {
            return;
        }

        const span = element as HTMLSpanElement;
        const originalValue = span.innerText;

        const range = document.createRange();

        range.selectNodeContents(span);
        const sel = window.getSelection() as Selection;

        sel.removeAllRanges();
        sel.addRange(range);

        this.edit = {
            element: span,
            item,
            originalValue,
        };
        this.isEditing.value = true;

        span.addEventListener('keydown', this.onEditKeyDown);
        span.addEventListener('blur', this.onEditBlur);

        span.style.maxWidth = `calc(100% - ${45 + (item.depth * indentationWidth)}px)`;

        nextTick().then(() => span.focus());
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
    protected onEditAccept(value: string, item: TreeItem<ItemType>)
    {
        // for subclasses...
    }

    protected updateModel(fn: (item: TreeItem<ItemType>) => void)
    {
        this.model.value.forEach(fn);
        this.model.value = [...this.model.value];
    }

    public toggleItemExpanded(e: MouseEvent, item: TreeItem<ItemType>)
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

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected setParent(sourceObj: ItemType, parentObj: ItemType)
    {
        // subclasses...
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected reorder(sourceObj: ItemType, targetObj: ItemType)
    {
    // subclasses...
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTreeMouseOver = (event: MouseEvent) =>
    {
        this.isMouseOver = true;
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTreeMouseOut = (event: MouseEvent) =>
    {
        this.isMouseOver = false;
        this.dragTarget.value = undefined;

        if (this.isDragging)
        {
            getApp().statusBar.clearMessage();
            this.onDragItemOut(event);
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDragItemOut(event: MouseEvent)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDragItemMove(update: MouseDragUpdate)
    {
        // subclasses
    }

    public onKeyDown = (event: KeyboardEvent) =>
    {
        if (event.key === 'Escape')
        {
            if (this.isDragging)
            {
                this.isDragging = false;
                this.dragTarget.value = undefined;
            }
            else if (this.isFocussed())
            {
                this.selection.deselect();
            }
        }
    };

    protected selectItem(e: MouseEvent, item: TreeItem<ItemType>): boolean
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
        else
        {
            // replace selection if not already selected
            selection.set(data);
        }

        return true;
    }

    public onRowMouseDown(event: MouseEvent, item: TreeItem<ItemType>)
    {
        if (event.button === 2)
        {
            // context menu right click - don't select
            event.stopPropagation();

            return;
        }

        const { selection, operation, dragTarget, options: { canReOrder, canReParent } } = this;
        const existingSelection = this.getSelectedIds();

        if (!this.selectItem(event, item))
        {
            // item was removed from selection, abort drag
            return;
        }

        this.isDragging = true;
        operation.value = Operation.ReParent;

        if (canReOrder || canReParent)
        {
            mouseDrag({ event }, this.onDragItemMove).then(({ event, deltaX, deltaY }) =>
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
                if (
                    deltaX === 0 && deltaY === 0
                    && `${this.getSelectedIds()}` === `${existingSelection}`
                )
                {
                    this.onEditOpen(event, item);
                }

                // clear drag state
                this.isDragging = false;
                this.dragTarget.value = undefined;

                if (this.lastClick > -1 && (Date.now() - this.lastClick) < dblClickTimeout && !this.isEditing.value)
                {
                    this.onDblClick(event, item);
                }

                this.lastClick = Date.now();

                getApp().statusBar.clearMessage();
            });
        }
    }

    public onRowMouseOver(e: MouseEvent, item: TreeItem<ItemType>)
    {
        const { isDragging, operation, dragTarget, selection, options: { canReParent, canReOrder }, isMouseOver } = this;

        if (!isMouseOver || getApp().itemDrag.isDragging)
        {
            return;
        }

        if (isDragging && (canReParent || canReOrder))
        {
            const targetElement = e.target as HTMLElement;

            operation.value = e.currentTarget === e.target || targetElement.classList.contains('arrow')
                ? Operation.ReOrder
                : Operation.ReParent;

            if (canReOrder && (operation.value === Operation.ReOrder))
            {
                // re-ordering
                const isSibling = this.isSiblingOf(item.data, selection.firstItem);

                let target = isSibling || item.data === this.getParent(selection.firstItem)
                    ? item
                    : undefined;

                if (target && !this.canReOrderTarget(target))
                {
                    target = undefined;
                }

                dragTarget.value = target;

                this.onHintReOrderTarget(selection.firstItem, target?.data);
            }
            else if (canReParent)
            {
                // re-parenting
                let target =  selection.shallowContains(item.data)
                    ? undefined
                    : item;

                if (target && !this.canReParentTarget(target))
                {
                    target = undefined;
                }

                dragTarget.value = target;

                this.onHintReParentTarget(selection.firstItem, target?.data);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onHintReOrderTarget(sourceObject: ItemType, targetObject: ItemType | undefined)
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onHintReParentTarget(sourceObject: ItemType, targetObject: ItemType | undefined)
    {
        // subclasses
    }

    public doesSelectionContainItem(item: TreeItem<ItemType>)
    {
        return this.selection.shallowContains(item.data);
    }

    public isItemReParentDragTarget(item: TreeItem<ItemType>, dragTarget?: TreeItem<ItemType>)
    {
        const { operation, options: { canReParent } } = this;

        return canReParent
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReParent;
    }

    public isItemReOrderDragTarget(item: TreeItem<ItemType>, dragTarget?: TreeItem<ItemType>)
    {
        const { operation, options: { canReOrder } } = this;

        return canReOrder
            && dragTarget === item
            && !this.doesSelectionContainItem(item)
            && operation.value === Operation.ReOrder;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected canReParentTarget(target: TreeItem<ItemType>)
    {
        return true;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected canReOrderTarget(target: TreeItem<ItemType>)
    {
        return true;
    }

    public selectPrev()
    {
        const { selection } = this;

        if (selection.hasSelection)
        {
            const index = this.model.value.findIndex((item) => item.data === selection.firstItem);

            if (index > 0)
            {
                selection.set(this.model.value[index - 1].data);
            }
        }
        else
        {
            this.selection.add(this.model.value[this.model.value.length - 1].data);
        }
    }

    public selectNext()
    {
        const { selection } = this;

        if (selection.hasSelection)
        {
            const index = this.model.value.findIndex((item) => item.data === selection.firstItem);

            if (index < this.model.value.length - 1)
            {
                selection.set(this.model.value[index + 1].data);
            }
        }
        else
        {
            this.selection.add(this.model.value[0].data);
        }
    }

    protected isFocussed()
    {
        return true;
    }

    public isPrimarySelection(item: TreeItem<ItemType>)
    {
        const { selection } = this;

        if (selection.hasSelection)
        {
            return selection.firstItem === item.data;
        }

        return false;
    }
}
