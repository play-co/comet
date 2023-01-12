import { clearInstances } from '../../../core/nodes/instances';
import { createProjectSchema } from '../../../core/nodes/schema';
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
import { Menu } from '../views/components/menu';

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

export const devMenu = new Menu([
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
