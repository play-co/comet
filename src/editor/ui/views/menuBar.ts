import { Menu } from './components/menu';

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
    ]);
}

export const menu = new Menu([
    {
        label: 'File',
        menu: subMenu('File'),
    },
    {
        label: 'Edit',
        menu: subMenu('Edit'),
    },
]);

