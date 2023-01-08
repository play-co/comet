import '../ui/components/mouseListener';
import '../ui/components/keyboardListener';
import '../../core/nodes/nodeRegistry';

import type { GoldenLayout } from 'golden-layout';
import { Rectangle } from 'pixi.js';

import { enableLog } from '../../core/log';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import { ProjectNode } from '../../core/nodes/concrete/meta/projectNode';
import { clearInstances, getInstance } from '../../core/nodes/instances';
import { delay, nextTick } from '../../core/util';
import { RemoveNodeCommand } from '../commands/removeNode';
import { DevInspector } from '../devTools/devInspector';
import { CloneInspector } from '../devTools/inspectors/cloneInspector';
import { DatastoreNodeInspector } from '../devTools/inspectors/datastoreNodeInspector';
import { GraphNodeInspector } from '../devTools/inspectors/graphNodeInspector';
import { LogInspector } from '../devTools/inspectors/logInspector';
import { ModelInspector } from '../devTools/inspectors/modelInspector';
import { UndoStackInspector } from '../devTools/inspectors/undoStackInspector';
import Events from '../events';
import { LocalStorageProvider } from '../storage/localStorageProvider';
import { ConvergenceDatastore } from '../sync/convergenceDatastore';
import { RemoteObjectSync } from '../sync/remoteObjectSync';
import { Tools } from '../tools/tools';
import { DropZone } from '../ui/components/dropzone';
import { EditableViewport } from '../ui/components/viewport';
import type { FocusAreaId } from '../ui/views/components/focusArea';
import { ItemDrag } from '../ui/views/components/itemDrag';
import { restore } from '../ui/views/menuBar';
import { StatusBar } from '../ui/views/statusBar';
import { getUrlParam } from '../util';
import { HierarchySelection } from './hierarchySelection';
import { initHistory, writeUndoStack } from './history';
import { ProjectSelection } from './projectSelection';
import type { Tool } from './tool';
import UndoStack from './undoStack';
import {
    type DevInspectorPrefs,
    type UserEditPrefs,
    type UserSelectionPrefs,
    loadPrefs,
    saveUserEditPrefs,
    saveUserSelectionPrefs,
} from './userPrefs';

export type AppOptions = {};

export interface GridSettings
{
    precision: number;
    bigUnit: number;
    mediumUnit: number;
    smallUnit: number;
}

export const defaultGridSettings: GridSettings = {
    precision: 2,
    bigUnit: 100,
    mediumUnit: 50,
    smallUnit: 10,
};

export class Application
{
    public datastore: ConvergenceDatastore;
    public nodeUpdater: RemoteObjectSync;
    public undoStack: UndoStack;
    public viewport: EditableViewport;
    public storageProvider: LocalStorageProvider;
    public project: ProjectNode;
    public statusBar: StatusBar;
    public itemDrag: ItemDrag;
    public selection: {
        hierarchy: HierarchySelection;
        project: ProjectSelection;
    };

    public tool: Tool;

    public gridSettings: GridSettings;
    public layout?: GoldenLayout;
    protected focusArea: FocusAreaId | null;
    protected focusAreaElements: Map<FocusAreaId, HTMLElement>;
    protected clipboard: ClonableNode[];

    public colorPickerMode: 'hex' | 'rgb' | 'hsv' = 'hex';

    private static _instance: Application;

    public static get instance()
    {
        if (!Application._instance)
        {
            throw new Error('Application not defined');
        }

        return Application._instance;
    }

    constructor(public readonly options: AppOptions)
    {
        Application._instance = this;

        const win = window as any;

        win.app = this;
        win.$ = getInstance; // todo: remove, only for development

        enableLog();

        this.statusBar = new StatusBar();
        this.itemDrag = new ItemDrag();

        const datastore = this.datastore = new ConvergenceDatastore();

        this.gridSettings = {
            ...defaultGridSettings,
        };

        this.clipboard = [];
        this.focusArea = null;
        this.focusAreaElements = new Map();

        this.storageProvider = new LocalStorageProvider();
        this.project = new ProjectNode();
        this.selection = {
            hierarchy: new HierarchySelection('$2'),
            project: new ProjectSelection('$3'),
        };
        this.nodeUpdater = new RemoteObjectSync(datastore);
        this.viewport = new EditableViewport();
        this.undoStack = new UndoStack();
        this.tool = Tools.select;

        Events.datastore.node.remote.removed.bind(writeUndoStack);

        initHistory();
        this.initEvents();
    }

    public async connect()
    {
        Events.datastore.connection.attempt.emit();

        await this.datastore.connect();

        Events.datastore.connection.success.emit();
    }

    public async init()
    {
        this.initDevInspectors();

        if (window.location.hash === '#restore')
        {
            // special case for dev tools
            await this.createProject('Test');
            restore();

            return;
        }

        const lastProjectId = localStorage.getItem('comet:lastProjectId');

        if (getUrlParam<number>('open') === 1 && lastProjectId)
        {
            await this.openProject(lastProjectId);
        }
        else
        {
            await this.createProject('Test');
        }

        this.project.isReady = true;
        Events.project.ready.emit();
    }

    public async createProject(name: string)
    {
        const { datastore } = this;

        Events.project.create.attempt.emit();

        this.clear();

        try
        {
            const lastProjectId = localStorage.getItem('comet:lastProjectId');

            if (lastProjectId && await datastore.hasProject(lastProjectId))
            {
                await datastore.deleteProject(lastProjectId);
            }

            const project = await datastore.createProject(name);

            this.project.copy(project);

            this.initProject();
        }
        catch (e)
        {
            console.error('CREATE PROJECT ERROR:', e);
            Events.project.create.error.emit(e as Error);
        }

        Events.project.create.success.emit();
    }

    public async openProject(id: string)
    {
        Events.project.open.attempt.emit();

        this.clear();

        const project = await this.datastore.openProject(id);

        this.project.copy(project);

        this.linkDeferredCloners();
        this.initProject();

        Events.project.open.success.emit();
    }

    protected linkDeferredCloners()
    {
        this.project.walk<ClonableNode>((node) =>
        {
            if (node.deferredCloner)
            {
                const cloner = getInstance<ClonableNode>(node.deferredCloner);

                if (node.cloneInfo.cloneMode === 'reference')
                {
                    node.model = cloner.model;
                }

                node.cloneInfo.cloner = cloner;
                node.initCloning();
                delete node.deferredCloner;
            }
        });
    }

    protected initProject()
    {
        const scene = this.project.getRootFolder('Scenes').getChildAt(0);
        let root = scene.cast<DisplayObjectNode>();

        const prefs = loadPrefs<UserEditPrefs>('edit');

        if (prefs)
        {
            const { viewportRoot, colorPickerMode } = prefs;

            this.colorPickerMode = colorPickerMode;

            try
            {
                root = getInstance<DisplayObjectNode>(viewportRoot);
            }
            catch (e)
            {
                // silent fail
            }
        }

        this.viewport.setRoot(root, false);

        // allow main layout fade time to start
        delay(100).then(() => this.initPersistentSelection());
    }

    public clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
        this.project.isReady = false;
    }

    public restoreNode(nodeId: string)
    {
        const node = getInstance<ClonableNode>(nodeId);

        const dependencies = node.getRestoreDependencies();

        dependencies.filter((dependantNode) => dependantNode.isCloaked)
            .forEach((node) => new RemoveNodeCommand({ nodeId: node.id }).undo());
    }

    protected initEvents()
    {
        // context menu
        document.addEventListener('contextmenu', (event) =>
        {
            event.preventDefault();
            if (this.project.isReady)
            {
                Events.contextMenu.open.emit(event);
            }
        });
    }

    protected initPersistentSelection()
    {
        const prefs = loadPrefs<UserSelectionPrefs>('selection');

        // load selection prefs if found
        if (prefs)
        {
            const { hierarchy, project } = prefs;

            hierarchy.forEach((id) =>
            {
                try
                {
                    const node = getInstance<ClonableNode>(id);

                    this.selection.hierarchy.add(node);
                }
                catch (e)
                {
                    //
                }
            });

            project.forEach((id) =>
            {
                try
                {
                    const node = getInstance<MetaNode>(id);

                    this.selection.project.add(node);
                }
                catch (e)
                {
                    //
                }
            });
        }

        // listen to selection events
        Events.$('selection.', () => saveUserSelectionPrefs());
    }

    protected initDevInspectors()
    {
        if (getUrlParam<number>('devtools') === 1)
        {
            const container = document.createElement('div');

            container.setAttribute('id', 'dev-inspectors');
            document.body.appendChild(container);

            const graphNodeInspector = new GraphNodeInspector('Graph Nodes', 'blue');
            const cloneInspector = new CloneInspector('Clone Info', 'slateblue');
            const datastoreNodeInspector = new DatastoreNodeInspector('Datastore Nodes', 'green');
            const undoStackInspector = new UndoStackInspector('UndoStack', 'purple');
            const modelInspector = new ModelInspector('Models', 'brown');
            const logInspector = new LogInspector('Log', 'darkslategrey');

            const mediumMaxHeight = Math.round(screen.availHeight * 0.4);
            const shortMaxHeight = Math.round(screen.availHeight * 0.3);

            graphNodeInspector.maxHeight = mediumMaxHeight;
            cloneInspector.maxHeight = mediumMaxHeight;
            datastoreNodeInspector.maxHeight = mediumMaxHeight;
            undoStackInspector.maxHeight = mediumMaxHeight;
            modelInspector.maxHeight = mediumMaxHeight;
            logInspector.maxHeight = shortMaxHeight;

            const prefs = loadPrefs<DevInspectorPrefs>('dev-inspectors');

            if (prefs)
            {
                prefs.order.forEach((id) =>
                {
                    const inspector = DevInspector.inspectors.get(id);

                    if (inspector)
                    {
                        inspector.mount();
                    }
                });
            }
            else
            {
                graphNodeInspector.mount();
                cloneInspector.mount();
                datastoreNodeInspector.mount();
                undoStackInspector.mount();
                modelInspector.mount();
                // logInspector.mount();
            }

            Events.key.down.bind((event) =>
            {
                if (event.key === '\\' && event.ctrlKey)
                {
                    DevInspector.toggle();
                }
            });
        }
    }

    public focusPanel(id: string)
    {
        const { layout } = this;

        if (layout)
        {
            const item = layout.findFirstComponentItemById(id);

            item && layout?.focusComponent(item);
        }
    }

    public edit(node: DisplayObjectNode)
    {
        this.selection.hierarchy.deselect();
        this.viewport.setRoot(node);
        this.focusPanel('hierarchy');

        saveUserEditPrefs();
    }

    public isAreaFocussed(...id: FocusAreaId[])
    {
        return id.some((id) => this.focusArea === id);
    }

    public getFocusArea(): FocusAreaId | null
    {
        return this.focusArea;
    }

    public registerFocusArea(id: FocusAreaId, element: HTMLElement)
    {
        this.focusAreaElements.set(id, element);
    }

    public getFocusAreaElement(id: FocusAreaId)
    {
        const element = this.focusAreaElements.get(id);

        if (!element)
        {
            throw new Error(`Focus area element not found: ${id}`);
        }

        return element;
    }

    public doesFocusAreaContain(id: FocusAreaId, clientX: number, clientY: number)
    {
        const element = getApp().getFocusAreaElement(id);
        const bounds = element.getBoundingClientRect();
        const rect = new Rectangle(bounds.left, bounds.top, bounds.width, bounds.height);

        return rect.contains(clientX, clientY);
    }

    public setFocusArea(id: FocusAreaId)
    {
        if (this.focusArea === id || DropZone.isDragOver)
        {
            return;
        }

        if (this.focusArea !== null)
        {
            Events.focus.blur.emit(this.focusArea);
        }

        this.focusArea = id;
        Events.focus.focus.emit(id);
    }

    public openContextMenuFromEvent(event: MouseEvent)
    {
        nextTick().then(() => Events.contextMenu.open.emit(event));
    }

    public getLayout()
    {
        if (!this.layout)
        {
            throw new Error('Layout not initialized');
        }

        return this.layout;
    }

    public setClipboard(nodes: ClonableNode[])
    {
        this.clipboard.length = 0;
        this.clipboard.push(...nodes);
    }

    public getClipboard()
    {
        return this.clipboard;
    }

    public hasClipboard()
    {
        return this.clipboard.length > 0;
    }

    public currentTool()
    {
        return this.tool;
    }

    public setTool(tool: Tool)
    {
        this.tool.deselect();
        Events.tool.deselect.emit(this.tool);

        this.tool = tool;

        tool.select();
        Events.tool.select.emit(tool);
    }
}

export function getApp()
{
    return Application.instance;
}

window.addEventListener('error', (e) =>
{
    Events.error.global.emit(e);
});

window.addEventListener('unhandledrejection', (e) =>
{
    Events.error.unhandledrejection.emit(e);
});
