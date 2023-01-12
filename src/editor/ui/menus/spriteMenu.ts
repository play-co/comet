import { Actions } from '../../actions';
import { getApp } from '../../core/application';
import { Menu, separator } from '../views/components/menu';

export const spriteMenu = new Menu(
    [
        {
            id: 'copy',
            label: 'Copy',
            action: Actions.copy,
        },
        {
            id: 'paste',
            label: 'Paste',
            action: Actions.paste,
        },
        {
            id: 'delete',
            label: 'Delete',
            action: Actions.deleteNode,
        },
        separator,
        {
            id: 'createPrefab',
            label: 'Create Prefab',
            action: Actions.createPrefabAsset,
        },
        separator,
        {
            id: 'resetModel',
            label: 'Reset Model',
            action: Actions.resetModel,
        },
        {
            id: 'unlink',
            label: 'Unlink',
            action: Actions.unlink,
        },
    ],
    (item) =>
    {
        if (!getApp().project.isReady)
        {
            item.isEnabled = false;
        }
    },
);
