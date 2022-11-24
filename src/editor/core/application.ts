import { Cache } from '../../core/cache';
import { getGlobalEmitter } from '../../core/events';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import { CloneMode } from '../../core/nodes/cloneInfo';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { ProjectNode } from '../../core/nodes/concrete/project';
import { clearInstances, getInstance } from '../../core/nodes/instances';
import { Actions } from '../actions';
import { CreateTextureAssetCommand } from '../commands/createTextureAsset';
import { RemoveNodeCommand } from '../commands/removeNode';
import type { DatastoreEvent } from '../events/datastoreEvents';
import type { ProjectEvent } from '../events/projectEvents';
import type { ViewportEvent } from '../events/viewportEvents';
import { LocalStorageProvider } from '../storage/localStorageProvider';
import { ConvergenceDatastore } from '../sync/convergenceDatastore';
import { RemoteObjectSync } from '../sync/remoteObjectSync';
import { getUserLogColor, getUserName } from '../sync/user';
import { EditableView } from '../ui/components/editableView';
import { getUrlParam } from '../util';
import { initHistory, writeUndoStack } from './history';
import { NodeSelection } from './selection';
import UndoStack from './undoStack';

const datastoreGlobalEmitter = getGlobalEmitter<DatastoreEvent>();
const projectGlobalEmitter = getGlobalEmitter<ProjectEvent>();
const viewportGlobalEmitter = getGlobalEmitter<ViewportEvent>();

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:LightCyan;';

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
    public editorViews: EditableView[];
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

        const datastore = this.datastore = new ConvergenceDatastore();

        this.storageProvider = new LocalStorageProvider();
        this.project = new ProjectNode();
        this.selection = new NodeSelection();
        this.nodeUpdater = new RemoteObjectSync(datastore);
        this.editorViews = [];
        this.undoStack = new UndoStack();
        this.gridSettings = {
            ...defaultGridSettings,
        };

        Cache.textures.fetchProvider = (storageKey: string) =>
            this.storageProvider.download(storageKey);

        datastoreGlobalEmitter.on('datastore.remote.node.removed', () =>
        {
            writeUndoStack();
        });

        initHistory();
    }

    public async connect()
    {
        datastoreGlobalEmitter.emit('datastore.connection.attempt');
        await this.datastore.connect();
        datastoreGlobalEmitter.emit('datastore.connection.success');
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
    }

    public async createProject(name: string, id: string)
    {
        const { datastore } = this;

        projectGlobalEmitter.emit('project.create.attempt');

        this.clear();

        if (await datastore.hasProject(name))
        {
            await datastore.deleteProject(id);
        }

        this.project = await datastore.createProject(name, id) as unknown as ProjectNode;
        this.initProject();

        projectGlobalEmitter.emit('project.create.success');
        projectGlobalEmitter.emit('project.ready');
    }

    public async openProject(id: string)
    {
        projectGlobalEmitter.emit('project.open.attempt');

        this.clear();

        this.project = await this.datastore.openProject(id) as unknown as ProjectNode;
        this.initProject();

        projectGlobalEmitter.emit('project.open.success');
        projectGlobalEmitter.emit('project.ready');
    }

    protected initProject()
    {
        this.newView(this.project.cast<ContainerNode>(), 'view1');
        // this.newView(this.project.clone(CloneMode.Reference).cast<ContainerNode>(), 'view2');
    }

    public newView(root: ContainerNode, title: string)
    {
        const view = new EditableView(root, title);

        this.editorViews.push(view);

        viewportGlobalEmitter.emit('viewport.open', view);
    }

    protected clear()
    {
        clearInstances();

        this.undoStack.clear();
        this.datastore.reset();
    }

    public restoreNode(nodeId: string)
    {
        console.log(`%c${logId}:%cRestore node "${nodeId}"`, userColor, logStyle);

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
