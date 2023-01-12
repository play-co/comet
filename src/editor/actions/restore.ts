import { Action } from '../core/action';
import { getApp } from '../core/application';
import { saveUserEditPrefs, saveUserLayoutPrefs, saveUserSelectionPrefs, saveUserViewportPrefs } from '../core/userPrefs';

export class RestoreAction extends Action
{
    constructor()
    {
        super('restore', {
            hotkey: 'Ctrl+R',
        });
    }

    protected exec()
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
}
