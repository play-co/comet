import { Actions } from '../../actions';
import { getApp } from '../../core/application';
import { Menu } from '../views/components/menu';

export const viewMenu = new Menu([
    {
        id: 'zoomIn',
        label: 'Zoom In',
        action: Actions.zoomIn,
    },
    {
        id: 'zoomOut',
        label: 'Zoom Out',
        action: Actions.zoomOut,
    },
    {
        id: 'resetView',
        label: 'Reset View',
        action: Actions.resetView,
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
