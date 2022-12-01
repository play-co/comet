import { getGlobalEmitter } from '../../../core/events';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { SetNodeIndexCommand } from '../../commands/setNodeIndex';
import { SetParentCommand } from '../../commands/setParent';
import { Application } from '../../core/application';
import type { CommandEvent } from '../../events/commandEvents';
import type { DatastoreEvent } from '../../events/datastoreEvents';
import type { SelectionEvent } from '../../events/selectionEvents';
import type { ViewportEvent } from '../../events/viewportEvents';
import { mouseDrag } from '../components/dragger';
import { WritableStore } from './store';

export interface ModelItem
{
    depth: number;
    node: DisplayObjectNode;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
}

export enum Operation
    {
    ReParent,
    ReOrder,
}

function createController()
{
    const { selection, viewport } = Application.instance;

    const model = new WritableStore<ModelItem[]>([]);
    const root = new WritableStore<DisplayObjectNode>(viewport.rootNode);
    const isDragging = new WritableStore<boolean>(false);
    const dragTarget = new WritableStore<ModelItem | undefined>(undefined);
    const operation = new WritableStore<Operation>(Operation.ReParent);

    const viewportEmitter = getGlobalEmitter<ViewportEvent>();
    const selectionEmitter = getGlobalEmitter<SelectionEvent>();
    const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();
    const commandEmitter = getGlobalEmitter<CommandEvent>();

    function generateModel()
    {
        const newModel = root.value.walk<DisplayObjectNode, { model: ModelItem[] }>(
            (node, options) =>
            {
                if (node.isCloaked)
                {
                    return;
                }

                options.data.model.push({
                    depth: options.depth,
                    isSelected: selection.shallowContains(node),
                    isExpanded: true,
                    isVisible: true,
                    node,
                });
            },
            {
                data: {
                    model: [],
                },
            },
        ).model;

        model.value = newModel;
    }

    function updateModel(fn: (item: ModelItem) => void)
    {
        model.value.forEach(fn);
        model.value = [...model.value];
    }

    function toggleItemExpanded(e: MouseEvent, item: ModelItem)
    {
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

    function selectItem(e: MouseEvent, item: ModelItem): undefined | false
    {
        const { node } = item;

        if (e.shiftKey || e.metaKey)
        {
            if (selection.shallowContains(node))
            {
            // remove from selection
                selection.remove(node);

                return false;
            }
            // add to selection
            selection.add(node);
        }
        else if (!selection.shallowContains(node))
        {
            // replace selection if not already selected
            selection.set(node);
        }

        return undefined;
    }

    function onRowMouseDown(e: MouseEvent, item: ModelItem)
    {
        if (selectItem(e, item) === false)
        {
            // item was removed from selection, abort drag
            return;
        }

        isDragging.value = true;
        operation.value = Operation.ReParent;

        mouseDrag(e).then(() =>
        {
            if (isDragging.value && dragTarget.value)
            {
                const dragTargetNode = dragTarget.value.node;

                selection.forEach((node) =>
                {
                    const sourceNode = node;

                    if (operation.value === Operation.ReParent)
                    {
                        // re-parent using command if different parent to existing
                        const nodeId = sourceNode.id;
                        const parentId = dragTargetNode.id;

                        if (sourceNode.parent && parentId !== sourceNode.parent.id)
                        {
                            Application.instance.undoStack.exec(
                                new SetParentCommand({
                                    nodeId,
                                    parentId,
                                    updateMode: 'full',
                                }),
                            );
                        }
                    }
                    else
                    {
                        // re-order using command if different index to current
                        const sourceNode = selection.nodes[0];
                        const parentNode
                  = dragTargetNode === sourceNode.parent
                      ? dragTargetNode
                      : (dragTargetNode.parent as DisplayObjectNode);

                        const index
                  = dragTargetNode === sourceNode.parent
                      ? 0
                      : parentNode.indexOf(dragTargetNode, true) + 1;

                        if (index !== sourceNode.index)
                        {
                            Application.instance.undoStack.exec(
                                new SetNodeIndexCommand({
                                    nodeId: sourceNode.id,
                                    index,
                                    updateMode: 'full',
                                }),
                            );
                        }
                    }

                    generateModel();
                });
            }

            clearDrag();
        });
    }

    function onRowMouseOver(e: MouseEvent, item: ModelItem)
    {
        if (isDragging.value)
        {
            const targetElement = e.target as HTMLElement;

            operation.value = e.currentTarget === e.target || targetElement.classList.contains('arrow')
                ? Operation.ReOrder
                : Operation.ReParent;

            if (operation.value === Operation.ReOrder)
            {
                // re-ordering
                item.node.isSiblingOf(selection.nodes[0]) || item.node === selection.nodes[0].parent
                    ? dragTarget.value = item
                    : dragTarget.value = undefined;
            }
            else
            {
                // re-parenting
                selection.shallowContains(item.node)
                    ? dragTarget.value = undefined
                    : dragTarget.value = item;
            }
        }
    }

    function clearDrag()
    {
        isDragging.value = false;
        dragTarget.value = undefined;
    }

    function doesSelectionContainItem(item: ModelItem)
    {
        return selection.shallowContains(item.node);
    }

    // handlers

    const onViewportRootChanged = (node: DisplayObjectNode) =>
    {
        root.value = node;
        generateModel();
    };

    const onSelectionChanged = () =>
    {
        updateModel((item) =>
        {
            item.isSelected = selection.shallowContains(item.node);
        });
    };

    const onDeselect = () =>
    {
        updateModel((item) =>
        {
            item.isSelected = false;
        });
    };

    // bind to global events

    viewportEmitter.on('viewport.root.changed', onViewportRootChanged);

    selectionEmitter
        .on('selection.add', onSelectionChanged)
        .on('selection.remove', onSelectionChanged)
        .on('selection.set.single', onSelectionChanged)
        .on('selection.set.multi', onSelectionChanged)
        .on('selection.deselect', onDeselect);

    datastoreEmitter
        .on('datastore.remote.node.parent.set', generateModel)
        .on('datastore.local.node.created', generateModel)
        .on('datastore.local.node.cloaked', generateModel)
        .on('datastore.local.node.uncloaked', generateModel)
        .on('datastore.remote.node.children.set', generateModel);

    commandEmitter
        .on('command.undo', generateModel)
        .on('command.redo', generateModel)
        .on('command.exec', generateModel);

    // init current model

    generateModel();

    return {
        store: {
            model: model.store,
            root: root.store,
            isDragging: isDragging.store,
            dragTarget: dragTarget.store,
            operation: operation.store,
        },
        onRowMouseDown,
        onRowMouseOver,
        toggleItemExpanded,
        doesSelectionContainItem,
    };
}

export { createController };

