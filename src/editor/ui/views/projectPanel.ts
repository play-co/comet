import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import type { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { SetNodeIndexCommand } from '../../commands/setNodeIndex';
import { SetParentCommand } from '../../commands/setParent';
import { Application } from '../../core/application';
import { ProjectNodeSelection } from '../../core/projectNodeSelection';
import Events from '../../events';
import { type TreeItem, TreeViewModel } from './components/treeView';
import { Icons } from './icons';

class ProjectTree extends TreeViewModel<MetaNode>
{
    constructor()
    {
        super(new ProjectNodeSelection());
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

    public getLabel(obj: MetaNode)
    {
        return obj.model.getValue<string>('name');
    }

    public getId(obj: MetaNode)
    {
        return obj.id;
    }

    public getParent(obj: MetaNode)
    {
        return obj.parent as (MetaNode | undefined);
    }

    public isSiblingOf(
        obj: MetaNode,
        other: MetaNode,
    )
    {
        return obj.isSiblingOf(other);
    }

    public hasChildren(obj: MetaNode)
    {
        if (obj.nodeType() === 'Scene')
        {
            return false;
        }

        return obj.hasChildren;
    }

    protected setParent(
        sourceObj: MetaNode,
        parentObj: MetaNode,
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
        sourceObj: MetaNode,
        targetObj: MetaNode,
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

function createModel()
{
    const tree = new ProjectTree();

    tree.allowMultiSelect = false;

    // bind to global events
    Events.$('selection.(add|remove|setSingle|setMulti)', tree.onSelectionChanged);
    Events.$('datastore.node|command', tree.rebuildModel);
    Events.project.ready.bind(tree.rebuildModel);
    Events.selection.deselect.bind(tree.onDeselect);

    // init current model
    tree.rebuildModel();

    return tree;
}

export { createModel };

