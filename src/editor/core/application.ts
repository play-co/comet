import type { GoldenLayout } from 'golden-layout';

import { enableLog } from '../../core/log';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import type { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { ProjectNode } from '../../core/nodes/concrete/meta/projectNode';
import { clearInstances, getInstance } from '../../core/nodes/instances';
import { Actions } from '../actions';
import { CreateTextureAssetCommand } from '../commands/createTextureAsset';
import { RemoveNodeCommand } from '../commands/removeNode';
import { DatastoreNodeInspector } from '../devTools/inspectors/datastoreNodeInspector';
import { GraphNodeInspector } from '../devTools/inspectors/graphNodeInspector';
import { LogInspector } from '../devTools/inspectors/logInspector';
import { UndoStackInspector } from '../devTools/inspectors/undoStackInspector';
import Events from '../events';
import { LocalStorageProvider } from '../storage/localStorageProvider';
import { ConvergenceDatastore } from '../sync/convergenceDatastore';
import { RemoteObjectSync } from '../sync/remoteObjectSync';
import { EditableViewport } from '../ui/components/viewport';
import { getUrlParam } from '../util';
import { HierarchySelection } from './hierarchySelection';
import { initHistory, writeUndoStack } from './history';
import { ProjectSelection } from './projectSelection';
import UndoStack from './undoStack';

export type AppOptions = {};

export interface GridSettings
{
    bigUnit: number;
    mediumUnit: number;
    smallUnit: number;
}

export const defaultGridSettings: GridSettings = {
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
    public selection: {
        hierarchy: HierarchySelection;
        project: ProjectSelection;
    };

    public gridSettings: GridSettings;
    public layout?: GoldenLayout;

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

        (window as any).app = this;

        this.preloadAssets();

        enableLog();

        const datastore = this.datastore = new ConvergenceDatastore();

        this.gridSettings = {
            ...defaultGridSettings,
        };

        this.storageProvider = new LocalStorageProvider();
        this.project = new ProjectNode();
        this.selection = {
            hierarchy: new HierarchySelection(),
            project: new ProjectSelection(),
        };
        this.nodeUpdater = new RemoteObjectSync(datastore);
        this.viewport = new EditableViewport();
        this.undoStack = new UndoStack();

        Events.datastore.node.remote.removed.bind(writeUndoStack);

        initHistory();
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

        const lastProjectId = localStorage.getItem('comet:lastProjectId');

        if (getUrlParam<number>('open') === 1 && lastProjectId)
        {
            await this.openProject(lastProjectId);
        }
        else
        {
            await this.createProject('Test');
        }

        this.initEvents();

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

            this.project = await datastore.createProject(name);

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

        this.project = await this.datastore.openProject(id);
        this.initProject();

        Events.project.open.success.emit();
    }

    protected initProject()
    {
        const scene = this.project.getRootFolder('Scenes').getChildAt(0);

        this.viewport.setRoot(scene.cast<DisplayObjectNode>());

        this.project.updateRecursive();
    }

    protected clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
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
            Events.editor.contextMenuOpen.emit(event);
        });
    }

    protected initDevInspectors()
    {
        if (getUrlParam<number>('devtools') === 1)
        {
            const graphNodeInspector = new GraphNodeInspector('Graph Nodes', 'blue');
            const datastoreNodeInspector = new DatastoreNodeInspector('Datastore Nodes', 'green');
            const logInspector = new LogInspector('Log', 'darkslategrey');
            const undoStackInspector = new UndoStackInspector('UndoStack', 'purple');

            const mediumMaxHeight = Math.round(screen.availHeight * 0.3);
            const shortMaxHeight = Math.round(screen.availHeight * 0.2);
            const container = document.body;

            graphNodeInspector.maxHeight = mediumMaxHeight;
            datastoreNodeInspector.maxHeight = mediumMaxHeight;
            logInspector.maxHeight = shortMaxHeight;
            undoStackInspector.maxHeight = mediumMaxHeight;

            graphNodeInspector.mount(container);
            datastoreNodeInspector.mount(container);
            logInspector.mount(container);
            undoStackInspector.mount(container);
        }
    }

    protected preloadAssets()
    {
        const preload = document.getElementById('preload') as HTMLDivElement;

        [
            '/assets/scene.ico',
            '/assets/folder.ico',
            '/assets/sprite.ico',
            '/assets/texture.ico',
            '/assets/container.ico',
        ].forEach((path) =>
        {
            const img = new Image();

            img.classList.add('preload');
            img.src = path;

            preload.appendChild(img);
        });
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
    }

    public importLocalTextures(files: FileList, createSprite = true)
    {
        const { project: selection } = this.selection;
        const file = files[0];

        let folderParentId: string | undefined;

        if (selection.hasSelection
            && selection.firstNode.nodeType() === 'Folder'
            && selection.firstNode.cast<FolderNode>().isWithinRootFolder('Textures'))
        {
            folderParentId = selection.firstNode.id;
        }
        const { promise } = new CreateTextureAssetCommand({ folderParentId, file }).run();

        promise.then((texture) =>
        {
            if (createSprite)
            {
                Actions.newSprite.dispatch({
                    addToSelected: false,
                    model: {
                        textureAssetId: texture.id,
                        tint: 0xffffff,
                    },
                });
            }
        });
    }
}
