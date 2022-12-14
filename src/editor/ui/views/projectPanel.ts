import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import type { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { Application } from '../../core/application';
import type { ProjectSelection } from '../../core/projectSelection';
import Events from '../../events';
import type { TreeItem } from './components/treeView';
import { Icons } from './icons';
import { NodeTreeModel } from './nodeTreeModel';

export class ProjectTree extends NodeTreeModel<ProjectSelection>
{
    constructor()
    {
        super(Application.instance.selection.project, {
            allowMultiSelect: false,
        });

        // bind to global events
        Events.$('selection.project.(add|remove|setSingle|setMulti)', this.onSelectionChanged);
        Events.$('datastore.node|command', this.rebuildModel);
        Events.project.ready.bind(this.rebuildModel);
        Events.selection.hierarchy.deselect.bind(this.onDeselect);
    }

    protected generateModel()
    {
        const { project } = Application.instance;

        const folders = project.getAssetFolders();
        const model: TreeItem<MetaNode>[] = [];

        model.push(...this.getModelItems(folders.Textures));
        model.push(...this.getModelItems(folders.Scenes));
        model.push(...this.getModelItems(folders.Prefabs));

        return model;
    }

    protected getModelItems(rootFolder: FolderNode)
    {
        const { selection } = this;

        return rootFolder.walk<MetaNode, { model: TreeItem<MetaNode>[] }>(
            (node, options) =>
            {
                if (node.isCloaked || !node.isMetaNode)
                {
                    options.cancel = true;

                    return;
                }

                const item: TreeItem<MetaNode> = {
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

    public hasChildren(obj: MetaNode)
    {
        if (obj.nodeType() === 'Scene')
        {
            return false;
        }

        return obj.hasChildren;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDblClick(e: MouseEvent, item: TreeItem<MetaNode>)
    {
        const node = item.data;

        if (node.nodeType() === 'Scene')
        {
            Application.instance.edit(node.cast<DisplayObjectNode>());
        }
    }

    protected canReParentTarget(target: TreeItem<MetaNode>)
    {
        const sourceNode = this.selection.firstNode;
        const targetNode = target.data;

        if (targetNode.nodeType() === 'Folder')
        {
            return super.canReParentTarget(target)
                && targetNode.cast<FolderNode>().getRootFolder().contains(sourceNode);
        }

        return false;
    }
}
