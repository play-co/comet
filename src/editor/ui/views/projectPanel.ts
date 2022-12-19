import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { TextureAssetNode } from '../../../core/nodes/concrete/meta/assets/textureAssetNode';
import { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { SceneNode } from '../../../core/nodes/concrete/meta/sceneNode';
import { Actions } from '../../actions';
import { Application, getApp } from '../../core/application';
import type { ProjectSelection } from '../../core/projectSelection';
import Events from '../../events';
import { NodeTreeModel } from './components/nodeTreeModel';
import type { TreeItem } from './components/treeModel';
import { Icons } from './icons';

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
        Events.selection.project.deselect.bind(this.onDeselect);
        Events.itemDrag.endDrag.bind(this.onItemDragEnd);
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

    public hasChildren(node: MetaNode)
    {
        if (node.is(SceneNode))
        {
            return false;
        }

        return super.hasChildren(node);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDblClick(e: MouseEvent, item: TreeItem<MetaNode>)
    {
        const node = item.data;

        if (node.is(SceneNode))
        {
            Application.instance.edit(node.cast<DisplayObjectNode>());
        }
    }

    protected canReParentTarget(target: TreeItem<MetaNode>)
    {
        const sourceNode = this.selection.firstNode;
        const targetNode = target.data;

        if (targetNode.is(FolderNode))
        {
            return super.canReParentTarget(target)
                && targetNode.cast<FolderNode>().getRootFolder().contains(sourceNode);
        }

        return false;
    }

    protected onDragItemOut(event: MouseEvent)
    {
        const draggable = this.selection.items.filter((item) => item.is(TextureAssetNode));

        if (draggable.length > 0)
        {
            getApp().itemDrag.startDrag('project', event, draggable[0]);
        }
    }

    protected onItemDragEnd = ({ focusAreaId, item, event }: typeof Events.itemDrag.endDrag.type) =>
    {
        if (focusAreaId === 'viewport')
        {
            const app = getApp();
            const textureAsset = item as TextureAssetNode;
            const viewportLocalPos = app.viewport.getMouseLocalPoint(event);
            let parentId: string | undefined;
            let x = viewportLocalPos.x;
            let y = viewportLocalPos.y;

            if (app.selection.hierarchy.hasSelection)
            {
                const targetNode = app.selection.hierarchy.firstNode.cast<DisplayObjectNode>();
                const mousePos = app.viewport.getMousePos(event.clientX, event.clientY);
                const localPoint = targetNode.globalToLocal(mousePos.x, mousePos.y);

                parentId = targetNode.id;
                x = localPoint.x;
                y = localPoint.y;
            }

            Actions.newSprite.dispatch({
                addToSelected: false,
                parentId,
                model: {
                    x,
                    y,
                    textureAssetId: textureAsset.id,
                    tint: 0xffffff,
                } });
        }
    };
}
