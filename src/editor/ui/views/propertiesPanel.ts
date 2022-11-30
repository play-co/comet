import { writable } from 'svelte/store';

import { Application } from '../../core/application';

export type State =
{

};

function createController()
{
    const { selection } = Application.instance;
    const state: State = {

    };
    const { subscribe, set } = writable(state);

    // const viewportEmitter = getGlobalEmitter<ViewportEvent>();
    // const selectionEmitter = getGlobalEmitter<SelectionEvent>();
    // const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();
    // const commandEmitter = getGlobalEmitter<CommandEvent>();

    // function update()
    // {
    //     set({ ...state });
    // }

    // function generateModel()
    // {
    //     const newModel = state.root.walk<DisplayObjectNode, { model: ModelItem[] }>(
    //         (node, options) =>
    //         {
    //             if (node.isCloaked)
    //             {
    //                 return;
    //             }

    //             options.data.model.push({
    //                 depth: options.depth,
    //                 isSelected: selection.shallowContains(node),
    //                 isExpanded: true,
    //                 isVisible: true,
    //                 node,
    //             });
    //         },
    //         {
    //             data: {
    //                 model: [],
    //             },
    //         },
    //     ).model;

    //     state.model = newModel;
    //     update();
    // }

    // function updateModel(fn: (item: ModelItem) => void)
    // {
    //     state.model.forEach(fn);
    //     refresh();
    // }

    // function refresh()
    // {
    //     state.model = [...state.model];
    //     update();
    // }

    // function toggleItemExpanded(e: MouseEvent, item: ModelItem)
    // {
    //     const index = state.model.indexOf(item);

    //     item.isExpanded = !item.isExpanded;

    //     for (let i = index + 1; i <= state.model.length - 1; i++)
    //     {
    //         const subItem = state.model[i];

    //         if (subItem.depth > item.depth)
    //         {
    //             subItem.isVisible = item.isExpanded;
    //         }
    //         else if (subItem.depth <= item.depth)
    //         {
    //             break;
    //         }
    //     }

    //     item.isVisible = true;

    //     e.stopPropagation();
    //     refresh();
    // }

    // function selectItem(e: MouseEvent, item: ModelItem): undefined | false
    // {
    //     const { node } = item;

    //     if (e.shiftKey || e.metaKey)
    //     {
    //         if (selection.shallowContains(node))
    //         {
    //         // remove from selection
    //             selection.remove(node);

    //             return false;
    //         }
    //         // add to selection
    //         selection.add(node);
    //     }
    //     else if (!selection.shallowContains(node))
    //     {
    //         // replace selection if not already selected
    //         selection.set(node);
    //     }

    //     return undefined;
    // }

    // function onRowMouseDown(e: MouseEvent, item: ModelItem)
    // {
    //     if (selectItem(e, item) === false)
    //     {
    //         // item was removed from selection, abort drag
    //         return;
    //     }

    //     state.isDragging = true;
    //     state.operation = Operation.ReParent;

    //     update();

    //     mouseDrag(e).then(() =>
    //     {
    //         if (state.isDragging && state.dragTarget)
    //         {
    //             const dragTargetNode = state.dragTarget.node;

    //             selection.forEach((node) =>
    //             {
    //                 const sourceNode = node;

    //                 if (state.operation === Operation.ReParent)
    //                 {
    //                     // re-parent using command if different parent to existing
    //                     const nodeId = sourceNode.id;
    //                     const parentId = dragTargetNode.id;

    //                     if (sourceNode.parent && parentId !== sourceNode.parent.id)
    //                     {
    //                         Application.instance.undoStack.exec(
    //                             new SetParentCommand({
    //                                 nodeId,
    //                                 parentId,
    //                                 updateMode: 'full',
    //                             }),
    //                         );
    //                     }
    //                 }
    //                 else
    //                 {
    //                     // re-order using command if different index to current
    //                     const sourceNode = selection.nodes[0];
    //                     const parentNode
    //               = dragTargetNode === sourceNode.parent
    //                   ? dragTargetNode
    //                   : (dragTargetNode.parent as DisplayObjectNode);

    //                     const index
    //               = dragTargetNode === sourceNode.parent
    //                   ? 0
    //                   : parentNode.indexOf(dragTargetNode, true) + 1;

    //                     if (index !== sourceNode.index)
    //                     {
    //                         Application.instance.undoStack.exec(
    //                             new SetNodeIndexCommand({
    //                                 nodeId: sourceNode.id,
    //                                 index,
    //                                 updateMode: 'full',
    //                             }),
    //                         );
    //                     }
    //                 }

    //                 generateModel();
    //             });
    //         }

    //         clearDrag();
    //     });
    // }

    // function onRowMouseOver(e: MouseEvent, item: ModelItem)
    // {
    //     if (state.isDragging)
    //     {
    //         const targetElement = e.target as HTMLElement;

    //         state.operation
    //         = e.currentTarget === e.target
    //         || targetElement.classList.contains('arrow')
    //                 ? Operation.ReOrder
    //                 : Operation.ReParent;

    //         if (state.operation === Operation.ReOrder)
    //         {
    //         // re-ordering
    //             item.node.isSiblingOf(selection.nodes[0])
    //         || item.node === selection.nodes[0].parent
    //                 ? (state.dragTarget = item)
    //                 : (state.dragTarget = undefined);
    //         }
    //         else
    //         {
    //         // re-parenting
    //             selection.shallowContains(item.node)
    //                 ? (state.dragTarget = undefined)
    //                 : (state.dragTarget = item);
    //         }

    //         update();
    //     }
    // }

    // function clearDrag()
    // {
    //     state.isDragging = false;
    //     state.dragTarget = undefined;

    //     update();
    // }

    // function doesSelectionContainItem(item: ModelItem)
    // {
    //     return selection.shallowContains(item.node);
    // }

    // // handlers

    // const onViewportRootChanged = (node: DisplayObjectNode) =>
    // {
    //     state.root = node;
    //     generateModel();
    // };

    // const onSelectionChanged = () =>
    // {
    //     updateModel((item) =>
    //     {
    //         item.isSelected = selection.shallowContains(item.node);
    //     });
    // };

    // const onDeselect = () =>
    // {
    //     updateModel((item) =>
    //     {
    //         item.isSelected = false;
    //     });
    // };

    // // bind to global events

    // viewportEmitter.on('viewport.root.changed', onViewportRootChanged);

    // selectionEmitter
    //     .on('selection.add', onSelectionChanged)
    //     .on('selection.remove', onSelectionChanged)
    //     .on('selection.set', onSelectionChanged)
    //     .on('selection.deselect', onDeselect);

    // datastoreEmitter
    //     .on('datastore.remote.node.parent.set', generateModel)
    //     .on('datastore.local.node.created', generateModel)
    //     .on('datastore.local.node.cloaked', generateModel)
    //     .on('datastore.local.node.uncloaked', generateModel)
    //     .on('datastore.remote.node.children.set', generateModel);

    // commandEmitter
    //     .on('command.undo', generateModel)
    //     .on('command.redo', generateModel)
    //     .on('command.exec', generateModel);

    // // init current model

    // generateModel();

    return {
        subscribe,
    };
}

export { createController };
