import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import type { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { Application } from '../../core/application';
import { ProjectNodeSelection } from '../../core/projectNodeSelection';
import Events from '../../events';
import type { TreeItem } from './components/treeView';
import { Icons } from './icons';
import { NodeTreeModel } from './nodeTreeModel';

export class ProjectTree extends NodeTreeModel<ProjectNodeSelection>
{
    constructor()
    {
        super(new ProjectNodeSelection(), {
            allowMultiSelect: false,
        });

        // bind to global events
        Events.$('selection.(add|remove|setSingle|setMulti)', this.onSelectionChanged);
        Events.$('datastore.node|command', this.rebuildModel);
        Events.project.ready.bind(this.rebuildModel);
        Events.selection.deselect.bind(this.onDeselect);
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

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDblClick(e: MouseEvent, item: TreeItem<T>)
    {
        const node = item.data as MetaNode;

        if (node.nodeType() === 'Scene')
        {
            Application.instance.edit(node.cast<DisplayObjectNode>());
        }
    }
}
