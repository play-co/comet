import type { DisplayObject } from 'pixi.js';

import type { ClonableNode } from '../../../core';
import type { DisplayObjectModel, DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { SetNodeIndexCommand } from '../../commands/setNodeIndex';
import { SetParentCommand } from '../../commands/setParent';
import { Application } from '../../core/application';
import type { ItemSelection } from '../../core/itemSelection';
import type { NodeSelection } from '../../core/nodeSelection';
import Events from '../../events';
import { type TreeItem, TreeViewModel } from './treeView';

export interface ModelItem
{
    depth: number;
    node: ClonableNode;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
}

export enum Operation
    {
    ReParent,
    ReOrder,
}

class DisplayNodeTree extends TreeViewModel<DisplayObjectNode>
{
    public root: DisplayObjectNode;

    constructor(root: DisplayObjectNode, selection: NodeSelection)
    {
        super(selection as unknown as ItemSelection<DisplayObjectNode>);
        this.root = root;
    }

    protected generateModel(): TreeItem<DisplayObjectNode>[]
    {
        const { selection } = this;

        return this.root.walk<DisplayObjectNode, { model: TreeItem<DisplayObjectNode>[] }>(
            (node, options) =>
            {
                if (node.isCloaked)
                {
                    return;
                }

                options.data.model.push({
                    depth: options.depth,
                    isSelected: selection.shallowContains(node.cast()),
                    isExpanded: true,
                    isVisible: true,
                    data: node,
                });
            },
            {
                data: {
                    model: [],
                },
            },
        ).model;
    }

    protected getId(obj: DisplayObjectNode<DisplayObjectModel, DisplayObject>)
    {
        return obj.id;
    }

    protected getParent(obj: DisplayObjectNode<DisplayObjectModel, DisplayObject>)
    {
        return obj.parent as (DisplayObjectNode | undefined);
    }

    protected isSiblingOf(
        obj: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
        other: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
    )
    {
        return obj.isSiblingOf(other);
    }

    protected setParent(
        sourceObj: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
        parentObj: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
    )
    {
        const nodeId = sourceObj.id;
        const parentId = parentObj.id;

        if (sourceObj.parent && parentId !== sourceObj.parent.id)
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

    protected reorder(
        sourceObj: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
        targetObj: DisplayObjectNode<DisplayObjectModel, DisplayObject>,
    )
    {
        const parentNode = targetObj === sourceObj.parent
            ? targetObj
            : (targetObj.parent as DisplayObjectNode);

        const index = targetObj === sourceObj.parent
            ? 0
            : parentNode.indexOf(targetObj, true) + 1;

        if (index !== sourceObj.index)
        {
            Application.instance.undoStack.exec(
                new SetNodeIndexCommand({
                    nodeId: sourceObj.id,
                    index,
                    updateMode: 'full',
                }),
            );
        }
    }

    public onViewportRootChanged = (node: DisplayObjectNode) =>
    {
        this.root = node;
        this.rebuildModel();
    };

    public onSelectionChanged = () =>
    {
        this.updateModel((item) =>
        {
            item.isSelected = this.selection.shallowContains(item.data);
        });
    };

    public onDeselect = () =>
    {
        this.updateModel((item) =>
        {
            item.isSelected = false;
        });
    };
}

function createModel()
{
    const { viewport } = Application.instance;

    const tree = new DisplayNodeTree(viewport.rootNode, Application.instance.selection);

    // bind to global events
    Events.$('selection.(add|remove|setSingle|setMulti)', tree.onSelectionChanged);
    Events.$('datastore.node|command', tree.rebuildModel);
    Events.selection.deselect.bind(tree.onDeselect);
    Events.viewport.rootChanged.bind(tree.onViewportRootChanged);

    // init current model
    tree.rebuildModel();

    return tree;
}

export { createModel };

