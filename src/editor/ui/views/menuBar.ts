import { devMenu } from '../menus/devMenu';
import { editMenu } from '../menus/editMenu';
import { helpMenu } from '../menus/helpMenu';
import { Menu } from './components/menu';

export const menu = new Menu([
    {
        label: 'Dev',
        menu: devMenu,
    },
    {
        label: 'Edit',
        menu: editMenu,
    },
    {
        label: 'Help',
        menu: helpMenu,
    },
]);

