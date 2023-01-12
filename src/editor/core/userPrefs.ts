import { type ResolvedLayoutConfig, LayoutConfig } from 'golden-layout';

import { getApp } from './application';

export type UserPrefStorageKey = 'layout' | 'selection' | 'viewport' | 'edit' | 'dev-inspectors';

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
    colorPickerMode: 'hex' | 'rgb' | 'hsv';
    showGrid: boolean;
}

export interface DevInspectorPrefs
{
    order: string[];
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

export function loadPrefs<T>(storageKey: UserPrefStorageKey)
{
    const prefs = readStorage<T>(storageKey);

    if (prefs)
    {
        return prefs;
    }

    return null;
}

// Layout

export function getUserLayoutPrefs()
{
    const app = getApp();
    const layout = app.getLayout().saveLayout();

    return { layout } as UserLayoutPrefs;
}

export function saveUserLayoutPrefs(data = getUserLayoutPrefs())
{
    writeStorage('layout', data);
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

// Selection

export function getUserSelectionPrefs()
{
    const app = getApp();
    const { hierarchy, project } = app.selection;

    return {
        hierarchy: hierarchy.hasSelection ? hierarchy.items.map((item) => item.id) : [],
        project: project.items.map((item) => item.id),
    } as UserSelectionPrefs;
}

export function saveUserSelectionPrefs(data = getUserSelectionPrefs())
{
    writeStorage('selection', data);
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

// Viewport

export function getUserViewportPrefs()
{
    const app = getApp();

    return {
        x: app.view.x,
        y: app.view.y,
        scale: app.view.scale,
    } as UserViewportPrefs;
}

export function saveUserViewportPrefs(data = getUserViewportPrefs())
{
    writeStorage('viewport', data);
}

// Edit

export function getUserEditPrefs()
{
    const app = getApp();

    return {
        viewportRoot: app.view.rootNode.id,
        colorPickerMode: app.colorPickerMode,
        showGrid: app.gridSettings.visible,
    } as UserEditPrefs;
}

export function saveUserEditPrefs(data = getUserEditPrefs())
{
    writeStorage('edit', data);
}

// DevInspectors

export function getDevInspectorPrefs()
{
    const inspectors = document.querySelectorAll('#dev-inspectors .dev-inspector');
    const order: string[] = [];

    for (let i = 0; i < inspectors.length; i++)
    {
        const element = inspectors[i] as HTMLElement;

        order.push(element.getAttribute('data-id') as string);
    }

    return {
        order,
    } as DevInspectorPrefs;
}

export function saveDevInspectorPrefs(data = getDevInspectorPrefs())
{
    writeStorage('dev-inspectors', data);
}

