import { type ResolvedLayoutConfig, LayoutConfig } from 'golden-layout';

import { getApp } from './application';

export type UserPrefStorageKey = 'layout' | 'selection' | 'viewport' | 'edit';

export interface UserLayoutPrefs
{
    layout: ResolvedLayoutConfig | null;
}

export interface UserSelectionPrefs
{
    hierarchy: string[];
    project: string[];
}

export interface UserViewportPrefs
{
    x: number;
    y: number;
    scale: number;
}

export interface UserEditPrefs
{
    viewportRoot: string;
}

function storageKey(id: UserPrefStorageKey)
{
    return `comet:userPrefs:${id}`;
}

function writeStorage(id: UserPrefStorageKey, data: object)
{
    const key = storageKey(id);

    try
    {
        localStorage.setItem(key, JSON.stringify(data));
    }
    catch (e)
    {
        //
    }
}

function readStorage<T>(id: UserPrefStorageKey): T | null
{
    const key = storageKey(id);

    try
    {
        const serialised = localStorage.getItem(key);

        if (serialised)
        {
            return JSON.parse(serialised) as T;
        }
    }
    catch (e)
    {
        //
    }

    return null;
}

export function saveUserLayoutPrefs()
{
    const app = getApp();
    const layout = app.getLayout().saveLayout();

    writeStorage('layout', { layout } as UserLayoutPrefs);
}

export function saveUserSelectionPrefs()
{
    const app = getApp();
    const { hierarchy, project } = app.selection;

    writeStorage('selection', {
        hierarchy: hierarchy.hasSelection ? hierarchy.items.map((item) => item.id) : [],
        project: project.items.map((item) => item.id),
    } as UserSelectionPrefs);
}

export function saveUserViewportPrefs()
{
    const app = getApp();

    writeStorage('viewport', {
        x: app.viewport.x,
        y: app.viewport.y,
        scale: app.viewport.scale,
    } as UserViewportPrefs);
}

export function saveUserEditPrefs()
{
    const app = getApp();

    writeStorage('edit', {
        viewportRoot: app.viewport.rootNode.id,
    } as UserEditPrefs);
}

export function loadUserLayoutPrefs()
{
    const prefs = readStorage<UserLayoutPrefs>('layout');

    if (prefs)
    {
        const savedConfig = prefs.layout;

        if (savedConfig)
        {
            let persistGoldenLayoutConfig;

            try
            {
                if ('resolved' in savedConfig)
                {
                    persistGoldenLayoutConfig = LayoutConfig.fromResolved(savedConfig);
                }
                else
                {
                    persistGoldenLayoutConfig = savedConfig as unknown as LayoutConfig;
                }

                return persistGoldenLayoutConfig;
            }
            catch (e)
            {
                //
            }
        }
    }

    return null;
}

export function loadUserSelectionPrefs()
{
    const prefs = readStorage<UserSelectionPrefs>('selection');

    if (prefs)
    {
        return prefs;
    }

    return null;
}

export function loadUserViewportPrefs()
{
    const prefs = readStorage<UserViewportPrefs>('viewport');

    if (prefs)
    {
        return prefs;
    }

    return null;
}

export function loadUserEditPrefs()
{
    const prefs = readStorage<UserEditPrefs>('edit');

    if (prefs)
    {
        return prefs;
    }

    return null;
}
