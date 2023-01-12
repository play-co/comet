import { ClonableNode } from '../../../core';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { TextureAssetNode } from '../../../core/nodes/concrete/meta/assets/textureAssetNode';
import { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { SceneNode } from '../../../core/nodes/concrete/meta/sceneNode';
import { Actions } from '../../actions';
import { Application, getApp } from '../../core/application';
import type { ProjectSelection } from '../../core/projectSelection';
import Events from '../../events';
import type { MouseDragUpdate } from '../components/dragger';
import { round } from '../transform/util';
import { NodeTreeModel } from './components/nodeTreeModel';
import type { TreeItem } from './components/treeModel';
import { Icons } from './icons';

export type AssetCreationType = `texture` | `prefab`;

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

        return rootFolder.walk<ClonableNode, { model: TreeItem<MetaNode>[] }>(
            (node, options) =>
            {
                const isChildOfScene = node.parent?.is(SceneNode);
                const isChildOfPrefab = node.parent?.is(FolderNode) && node.parent.cast<FolderNode>().isWithinRootFolder('Prefabs');

                if (isChildOfScene || node.isCloaked)
                {
                    options.cancel = true;

                    return;
                }

                if (isChildOfPrefab && !node.is(FolderNode))
                {
                    const { isVariantRoot } = node.cloneInfo;
                    const item: TreeItem<ClonableNode> = {
                        id: node.id,
                        depth: options.depth,
                        isSelected: selection.shallowContains(node.cast()),
                        isExpanded: false,
                        isVisible: true,
                        data: node,
                        icon: isVariantRoot ? Icons.PrefabAssetVariant : Icons.PrefabAsset,
                    };

                    options.data.model.push(item);
                    // options.cancel = true;

                    return;
                }

                const item: TreeItem<ClonableNode> = {
                    id: node.id,
                    depth: options.depth,
                    isSelected: selection.shallowContains(node.cast()),
                    isExpanded: true,
                    isVisible: true,
                    data: node,
                    icon: Icons[node.nodeType() as keyof typeof Icons],
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
        const isChildOfPrefab = node.parent?.is(FolderNode) && node.parent.cast<FolderNode>().isWithinRootFolder('Prefabs');

        if (node.is(SceneNode) || isChildOfPrefab)
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
        const sourceNode = this.selection.firstItem;
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
        const draggable = this.selection.items.filter((item) => item.is(TextureAssetNode) || item.is(ClonableNode));

        if (draggable.length > 0)
        {
            const app = getApp();
            const assetName = draggable[0].model.getValue<string>('name');

            app.itemDrag.startDrag('project', event, draggable[0]);
            app.statusBar.setMessage(`Create instance of <${assetName}>`);
            app.view.gizmo.isInteractive = false;
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDragItemMove(update: MouseDragUpdate): void
    {
        const isValid = getApp().isAreaFocussed('viewport');
        const body = document.body;

        if (!isValid && !body.classList.contains('invalid'))
        {
            body.classList.add('invalid');
        }
        else if (isValid && body.classList.contains('invalid'))
        {
            body.classList.remove('invalid');
        }
    }

    protected getAssetType(node: ClonableNode): AssetCreationType
    {
        const app = getApp();

        if (node.is(TextureAssetNode))
        {
            return 'texture';
        }
        else if (app.project.getRootFolder('Prefabs').contains(node))
        {
            return 'prefab';
        }

        throw new Error(`Unknown asset type for node ${node.id}`);
    }

    protected onItemDragEnd = ({ focusAreaId, item, event }: typeof Events.itemDrag.endDrag.type) =>
    {
        if (focusAreaId === 'viewport')
        {
            const app = getApp();
            const assetNode = item as ClonableNode;
            const assetType = this.getAssetType(assetNode);
            const viewportLocalPos = app.view.getMouseLocalPoint(event);
            const precision = app.gridSettings.precision;
            let parentId: string | undefined;

            let x = viewportLocalPos.x;
            let y = viewportLocalPos.y;

            app.view.gizmo.isInteractive = true;

            if (app.selection.hierarchy.hasSelection)
            {
                let targetNode = app.selection.hierarchy.firstItem.cast<DisplayObjectNode>();

                if (assetType === 'prefab')
                {
                    // ensure that the prefab is not created within itself
                    const root = targetNode.getRootNode();

                    if (assetNode.hasCloned(root))
                    {
                        targetNode = root.parent as DisplayObjectNode;
                    }
                }

                const mousePos = app.view.getMousePos(event.clientX, event.clientY);
                const localPoint = targetNode.globalToLocal(mousePos.x, mousePos.y);

                x = localPoint.x;
                y = localPoint.y;

                parentId = targetNode.id;
            }

            x = round(x, precision);
            y = round(y, precision);

            if (assetType === 'texture')
            {
                Actions.newSprite.dispatch({
                    parentId,
                    model: {
                        x,
                        y,
                        textureAssetId: assetNode.id,
                        tint: 0xffffff,
                    } });
            }
            else if (assetType === 'prefab')
            {
                Actions.createPrefabInstance.dispatch({
                    clonerId: assetNode.id,
                    parentId,
                    model: {
                        x,
                        y,
                    } });
            }

            app.selection.hierarchy.update();
        }
    };

    protected isFocussed(): boolean
    {
        return Application.instance.isAreaFocussed('project');
    }
}
