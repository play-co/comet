import type { ClonableNode } from '../../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { SetNodeIndexCommand } from '../../commands/setNodeIndex';
import { SetParentCommand } from '../../commands/setParent';
import { Application } from '../../core/application';
import type { HierarchySelection } from '../../core/hierarchySelection';
import Events from '../../events';
import type { TreeItem } from './components/treeView';
import { Icons } from './icons';
import { NodeTreeModel } from './nodeTreeModel';

export class HierarchyTree extends NodeTreeModel<HierarchySelection>
{
    public root: ClonableNode;

    constructor()
    {
        super(Application.instance.selection.hierarchy);

        const { viewport } = Application.instance;

        this.root = viewport.rootNode.cast();

        // bind to global events
        Events.$('selection.hierarchy.(add|remove|setSingle|setMulti)', this.onSelectionChanged);
        Events.$('datastore.node|command', this.rebuildModel);
        Events.project.ready.bind(this.rebuildModel);
        Events.selection.hierarchy.deselect.bind(this.onDeselect);
        Events.viewport.rootChanged.bind(this.onViewportRootChanged);
    }

    protected generateModel()
    {
        const { selection } = this;

        return this.root.walk<ClonableNode, { model: TreeItem<ClonableNode>[] }>(
            (node, options) =>
            {
                if (node.isCloaked)
                {
                    options.cancel = true;

                    return;
                }

                const item: TreeItem<ClonableNode> = {
                    id: node.id,
                    depth: options.depth,
                    isSelected: selection.shallowContains(node.cast()),
                    isExpanded: true,
                    isVisible: true,
                    data: node,
                    icon: Icons[node.nodeType()],
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

    protected setParent(
        sourceObj: ClonableNode,
        parentObj: ClonableNode,
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
        sourceObj: ClonableNode,
        targetObj: ClonableNode,
    )
    {
        const parentNode = targetObj === sourceObj.parent
            ? targetObj
            : (targetObj.parent as ClonableNode);

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
        this.root = node.cast();
        this.rebuildModel();
    };
}

