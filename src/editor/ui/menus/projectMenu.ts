import { FolderNode } from '../../../core/nodes/concrete/meta/folderNode';
import { SceneNode } from '../../../core/nodes/concrete/meta/sceneNode';
import { Actions } from '../../actions';
import { getApp } from '../../core/application';
import app from '../../main';
import { Menu } from '../views/components/menu';

const onNewAssetFolder = () =>
{
    Actions.newFolder.dispatch();
};

const onDeleteAssetNode = () =>
{
    const node = getApp().selection.project.firstItem;

    if (app.project.getRootFolder('Textures').contains(node))
    {
        Actions.deleteTexture.dispatch({ nodeId: node.id });
    }
    else if (app.project.getRootFolder('Prefabs').contains(node))
    {
        Actions.deletePrefab.dispatch({ nodeId: node.id });
    }
};

const onCreateVariant = () =>
{
    Actions.createPrefabVariant.dispatch({ nodeId: getApp().selection.project.firstItem.id });
};

export const projectMenu = new Menu(
    [
        {
            id: 'newFolder',
            label: 'New Folder',
            onClick: onNewAssetFolder,
        },
        {
            id: 'delete',
            label: 'Delete',
            onClick: onDeleteAssetNode,
        },
        {
            id: 'createVariant',
            label: 'Create Variant',
            onClick: onCreateVariant,
        },
    ],
    (item) =>
    {
        const { id } = item;

        const app = getApp();
        const selection = app.selection.project;
        const project = app.project;

        if (!app.project.isReady)
        {
            return;
        }

        if (id === 'newFolder')
        {
            item.isHidden = !(selection.isSingle && selection.isSelected(FolderNode));
        }
        else if (id === 'delete')
        {
            item.isHidden = false;
            if (!selection.hasSelection)
            {
                // no items selected, item is disabled
                item.isHidden = true;
            }
            else
            {
                // check whether item is root folder or last scene
                const node = selection.firstItem;

                if (
                    (node.is(FolderNode) && node.cast<FolderNode>().isRootFolder())
            || (node.is(SceneNode)
              && project.getRootFolder('Scenes').getAllChildrenByType(SceneNode).length === 1)
                )
                {
                    // hide if root folder or last scene
                    item.isHidden = true;
                }
            }
        }
        else if (item.id === 'createVariant')
        {
            const node = selection.firstItem;

            item.isHidden = true;
            if (app.project.getRootFolder('Prefabs').contains(node) && !node.is(FolderNode))
            {
                item.isHidden = false;
            }
        }
    },
);
