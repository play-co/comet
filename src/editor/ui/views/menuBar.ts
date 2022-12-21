import { getApp } from '../../core/application';
import { Menu } from './components/menu';

export function restore()
{
    const app = getApp();
    const data = localStorage.getItem('comet:project');

    if (data)
    {
        app.datastore.fromProjectSchema(JSON.parse(data));
        app.statusBar.setMessage('Project restored from local storage, reloading...');
        window.location.href = window.location.href.replace(window.location.hash, '');
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
            const data = app.datastore.toProjectSchema();

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

