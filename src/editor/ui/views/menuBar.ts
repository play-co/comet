import { clearInstances } from '../../../core/nodes/instances';
import { createProjectSchema } from '../../../core/nodes/schema';
import { Actions } from '../../actions';
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
import Events from '../../events';
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

const devMenu = new Menu([
    {
        label: 'Clear',
        onClick: () =>
        {
            const app = getApp();

            clearInstances();
            const schema = createProjectSchema('Test');

            app.clear();

            app.datastore.fromProjectSchema(schema);

            app.statusBar.setMessage('Project nodes cleared, reloading...');

            setTimeout(() =>
            {
                window.location.href = window.location.href.replace(window.location.hash, '');
            }, 500);
        },
    },
    {
        label: 'Backup',
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

const editMenu = new Menu([
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

const helpMenu = new Menu([
    {
        label: 'About',
        onClick: () =>
        {
            Events.dialog.modal.open.emit('splash');
        },
    },
    {
        label: 'Report a bug',
        onClick: () =>
        {
            window.open('https://github.com/play-co/comet/issues/new?assignees=&labels=&template=bug_report.md&title=', '_blank');
        },
    },
    {
        label: 'Request a feature',
        onClick: () =>
        {
            window.open('https://github.com/play-co/comet/issues/new?assignees=&labels=&template=feature_request.md&title=', '_blank');
        },
    },
]);

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

