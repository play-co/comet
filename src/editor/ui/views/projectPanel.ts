import type { NodeAsset } from '../../../core/assets/nodeAsset';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { SetNodeIndexCommand } from '../../commands/setNodeIndex';
import { SetParentCommand } from '../../commands/setParent';
import { Application } from '../../core/application';
import { ProjectNodeSelection } from '../../core/projectNodeSelection';
import Events from '../../events';
import { type TreeItem, TreeViewModel } from './components/treeView';

class ProjectTree extends TreeViewModel<NodeAsset>
{
    constructor()
    {
        super(new ProjectNodeSelection());
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

                const item: TreeItem<DisplayObjectNode> = {
                    id: node.id,
                    depth: options.depth,
                    isSelected: selection.shallowContains(node.cast()),
                    isExpanded: true,
                    isVisible: true,
                    data: node,
                };

                options.data.model.push(item);
            },
            {
                data: {
                    model: [],
                },
            },
        ).model;
    }

    public getLabel(obj: DisplayObjectNode)
    {
        return obj.id;
    }

    public getId(obj: DisplayObjectNode)
    {
        return obj.id;
    }

    public getParent(obj: DisplayObjectNode)
    {
        return obj.parent as (DisplayObjectNode | undefined);
    }

    public isSiblingOf(
        obj: DisplayObjectNode,
        other: DisplayObjectNode,
    )
    {
        return obj.isSiblingOf(other);
    }

    public hasChildren(obj: DisplayObjectNode)
    {
        return obj.hasChildren;
    }

    protected setParent(
        sourceObj: DisplayObjectNode,
        parentObj: DisplayObjectNode,
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
        sourceObj: DisplayObjectNode,
        targetObj: DisplayObjectNode,
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

    const tree = new ProjectTree();

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

