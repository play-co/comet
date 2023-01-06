import { getApp } from '../../core/application';
import {
    getUserEditPrefs,
    getUserLayoutPrefs,
    getUserSelectionPrefs,
    getUserViewportPrefs,
    saveUserEditPrefs,
    saveUserLayoutPrefs,
    saveUserSelectionPrefs,
    saveUserViewportPrefs,
} from '../../core/userPrefs';
import { Menu } from './components/menu';

export function restore()
{
    const app = getApp();
    const data = JSON.parse(localStorage.getItem('comet:project') as string);
    const { projectData, viewportPrefs, editPrefs, selectionPrefs, layoutPrefs } = data;

    if (projectData)
    {
        app.datastore.fromProjectSchema(projectData);
        app.statusBar.setMessage('Project restored from local storage, reloading...');

        saveUserViewportPrefs(viewportPrefs);
        saveUserEditPrefs(editPrefs);
        saveUserSelectionPrefs(selectionPrefs);
        saveUserLayoutPrefs(layoutPrefs);

        setTimeout(() =>
        {
            window.location.href = window.location.href.replace(window.location.hash, '');
        }, 1000);
    }
}

function subMenu(prefix: string)
{
    const subMenuA = new Menu([{ label: 'Item Sub 4' }, { label: 'Item 5' }, { label: 'Item 6' }]);
    const subMenuB = new Menu([
        { label: 'Item Longer 7' },
        { label: 'Item 8' },
        { label: 'Item 9', menu: subMenuA },
    ]);

    return new Menu([
        { data: 1, label: `${prefix}Item 1` },
        { label: `${prefix}Item 2`, menu: subMenuB },
        { label: `${prefix}Item 3` },
    ], (item, index) =>
    {
        if (index === 0)
        {
            item.isEnabled = getApp().isAreaFocussed('viewport');
        }
    });
}

const fileMenu = new Menu([
    {
        label: 'Save',
        onClick: () =>
        {
            const app = getApp();
            const projectData = app.datastore.toProjectSchema();
            const viewportPrefs = getUserViewportPrefs();
            const editPrefs = getUserEditPrefs();
            const selectionPrefs = getUserSelectionPrefs();
            const layoutPrefs = getUserLayoutPrefs();
            const data = {
                projectData,
                viewportPrefs,
                editPrefs,
                selectionPrefs,
                layoutPrefs,
            };

            localStorage.setItem('comet:project', JSON.stringify(data));
            app.statusBar.setMessage('Project saved to local storage');
        },
    },
    {
        label: 'Restore',
        onClick: restore,
    },
]);

export const menu = new Menu([
    {
        label: 'File',
        menu: fileMenu,
    },
    {
        label: 'Edit',
        menu: subMenu('Edit'),
    },
]);

