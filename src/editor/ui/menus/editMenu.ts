import { Actions } from '../../actions';
import { Menu } from '../views/components/menu';

export const editMenu = new Menu([
    {
        id: 'undo',
        label: 'Undo',
        action: Actions.undo,
    },
    {
        id: 'redo',
        label: 'Redo',
        action: Actions.redo,
    },
]);
