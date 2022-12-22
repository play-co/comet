import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import Events from '../events';
import { Application } from './application';
import type { CommandName } from './commandFactory';

export type UpdateMode = 'graphOnly' | 'full';

export interface CommandSchema
{
    name: string;
    params: Record<string, any>;
}

export abstract class Command<ParamsType extends {} = {}, ReturnType = void, CacheType extends {} = {}>
{
    public cache: CacheType;
    public hasRun: boolean;
    public selectedNodes: string[];

    constructor(public readonly params: ParamsType)
    {
        this.cache = {} as CacheType;
        this.hasRun = false;
        this.selectedNodes = [];
    }

    public static commandName = 'Untitled';

    public abstract apply(): ReturnType;
    public abstract undo(): void;

    public get name(): CommandName
    {
        return (Object.getPrototypeOf(this).constructor as {commandName: string}).commandName as CommandName;
    }

    public get index(): number
    {
        return this.app.undoStack.indexOf(this);
    }

    public run(): ReturnType
    {
        const result = this.apply();

        this.hasRun = true;

        Events.command.run.emit(this);

        return result as unknown as ReturnType;
    }

    public redo()
    {
        this.apply();
    }

    public get app()
    {
        return Application.instance;
    }

    public get datastore()
    {
        return this.app.datastore;
    }

    protected getInstance<T extends ClonableNode<any, any>>(nodeId: string): T
    {
        const { datastore, app } = this;
        const node = getInstance<ClonableNode>(nodeId);

        if (!datastore.hasNodeProxy(nodeId))
        {
            app.restoreNode(node.id);
        }

        return node as unknown as T;
    }

    public storeSelection()
    {
        this.selectedNodes = this.app.selection.hierarchy.items.map((node) => node.id);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(mode: 'redo' | 'undo')
    {
        if (this.selectedNodes.length > 0)
        {
            this.app.selection.hierarchy.set(this.selectedNodes.map((nodeId) => this.getInstance(nodeId)));
        }
    }

    public toJSON(): CommandSchema
    {
        return {
            name: this.name,
            params: this.params,
        };
    }
}

