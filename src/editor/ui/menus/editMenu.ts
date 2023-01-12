import { Actions } from '../../actions';
import { getApp } from '../../core/application';
import { Menu } from '../views/components/menu';

export const editMenu = new Menu([
    {
        id: 'undo',
        label: 'Undo',
        onClick: () =>
        {
            Actions.undo.dispatch();
        },
    },
    {
        id: 'redo',
        label: 'Redo',
        onClick: () =>
        {
            Actions.redo.dispatch();
        },
    },
], (item) =>
{
    const { id } = item;

    if (id === 'undo')
    {
        item.isEnabled = getApp().undoStack.canUndo;
    }
    else if (id === 'redo')
    {
        item.isEnabled = getApp().undoStack.canRedo;
    }
});
