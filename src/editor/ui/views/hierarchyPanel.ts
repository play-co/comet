import type { ClonableNode } from '../../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { Application } from '../../core/application';
import type { HierarchySelection } from '../../core/hierarchySelection';
import Events from '../../events';
import { NodeTreeModel } from './components/nodeTreeModel';
import type { TreeItem } from './components/treeModel';
import { Icons } from './icons';

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

    public onViewportRootChanged = (node: DisplayObjectNode) =>
    {
        this.root = node.cast();
        this.rebuildModel();
    };

    protected isFocussed(): boolean
    {
        return Application.instance.isAreaFocussed('hierarchy');
    }
}

