import { Cache } from '../../core/cache';
import { enableLog } from '../../core/log';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import { ProjectNode } from '../../core/nodes/concrete/projectNode';
import { clearInstances, getInstance } from '../../core/nodes/instances';
import { createNodeSchema } from '../../core/nodes/schema';
import { Actions } from '../actions';
import { CreateNodeCommand } from '../commands/createNode';
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
import { initHistory, writeUndoStack } from './history';
import { NodeSelection } from './nodeSelection';
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
    public selection: NodeSelection;
    public gridSettings: GridSettings;

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

        enableLog();

        const datastore = this.datastore = new ConvergenceDatastore();

        this.gridSettings = {
            ...defaultGridSettings,
        };

        this.storageProvider = new LocalStorageProvider();
        this.project = new ProjectNode();
        this.selection = new NodeSelection();
        this.nodeUpdater = new RemoteObjectSync(datastore);
        this.viewport = new EditableViewport(this.project);
        this.undoStack = new UndoStack();

        Cache.textures.fetchProvider = (storageKey: string) =>
            this.storageProvider.download(storageKey);

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
        if (getUrlParam<number>('open') === 1)
        {
            await this.openProject('test');
        }
        else
        {
            await this.createProject('Test', 'test');
        }

        const nodes: DisplayObjectNode[] = [];

        this.project.walk<DisplayObjectNode>((node) =>
        {
            if (!node.isMetaNode)
            {
                nodes.push(node);
            }
        });

        document.addEventListener('contextmenu', (event) =>
        {
            event.preventDefault();
            Events.editor.contextMenuOpen.emit(event);
        });
    }

    public async createProject(name: string, id: string)
    {
        const { datastore } = this;

        Events.project.create.attempt.emit();

        this.clear();

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        this.project = await datastore.createProject(name, id) as unknown as ProjectNode;
        this.initProject();

        Events.project.create.success.emit();
        Events.project.ready.emit();
    }

    public async openProject(id: string)
    {
        Events.project.open.attempt.emit();

        this.clear();

        this.project = await this.datastore.openProject(id) as unknown as ProjectNode;
        this.initProject();

        Events.project.open.success.emit();
        Events.project.ready.emit();
    }

    protected initProject()
    {
        let scene = this.project.getChildAt(0);

        if (!scene)
        {
            const nodeSchema = createNodeSchema('Scene', { parent: this.project.id });
            const { node } = new CreateNodeCommand({
                nodeSchema,
            }).run();

            scene = node;
        }

        this.viewport.setRoot(scene.cast<DisplayObjectNode>());

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

    public createTexture(file: File)
    {
        const { promise } = new CreateTextureAssetCommand({ file }).run();

        promise.then((texture) =>
        {
            Actions.newSprite.dispatch({
                addToSelected: false,
                model: {
                    textureAssetId: texture.id,
                    tint: 0xffffff,
                },
            });
        });
    }
}
