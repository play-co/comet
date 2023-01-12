import { devMenu } from '../menus/devMenu';
import { editMenu } from '../menus/editMenu';
import { helpMenu } from '../menus/helpMenu';
import { viewMenu } from '../menus/viewMenu';
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
        label: 'View',
        menu: viewMenu,
    },
    {
        label: 'Help',
        menu: helpMenu,
    },
]);

