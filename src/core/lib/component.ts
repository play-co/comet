import EventEmitter from 'eventemitter3';

import type { Model } from './model/model';
import { createModel } from './model/model';
import type { ModelSchema } from './model/schema';

const ids = {} as Record<string, number>;

export type AnyComponent = Component<any, any>;

export type ComponentEvents = 'modified' | 'childAdded' | 'childRemoved' | 'disposed' | 'unlinked';

export enum SpawnMode
    {
    None = 'none',
    Variant = 'variant',
    Reference = 'reference',
    ReferenceRoot = 'referenceRoot',
    Duplicate = 'duplicate',
}

export abstract class Component<M extends object, V> extends EventEmitter<ComponentEvents>
{
    public model: Model<M> & M;
    public view: V;

    public parent?: AnyComponent;
    public children: AnyComponent[];

    public spawnMode: SpawnMode;
    public spawner?: Component<M, V>;
    public spawned: Component<M, V>[];

    public id: string;

    constructor(modelValues: Partial<M> = {}, spawner?: Component<M, V>, spawnMode: SpawnMode = SpawnMode.None)
    {
        super();

        const componentType = this.getComponentType();

        if (!ids[componentType])
        {
            ids[componentType] = 1;
        }

        this.id = `${componentType}:${ids[componentType]++}`;
        this.children = [];
        this.spawnMode = spawnMode;
        this.spawned = [];

        if (spawner && spawnMode === SpawnMode.Reference)
        {
            this.model = spawner.model;
        }
        else
        {
            const schema = this.modelSchema();

            this.model = createModel(schema, {
                ...modelValues,
            });
        }

        this.initModel();

        if (spawner)
        {
            this.setSpawner(spawner, spawnMode);
        }

        this.view = this.createView();

        this.update();
    }

    protected initModel()
    {
        this.model.on('modified', this.onModelModified);
    }

    public getComponentType(): string
    {
        return (Object.getPrototypeOf(this).constructor as {
            new (): object;
        }).name;
    }

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modified', key, value, oldValue);
    };

    public copy<T extends Component<M, V>>(spawnMode: SpawnMode = SpawnMode.Variant, isRoot = true): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (modelValues: Partial<M>, spawner?: Component<M, V>, spawnMode?: SpawnMode): T;
        };

        const component = new Ctor(
            {},
            this,
            spawnMode === SpawnMode.Reference && isRoot ? SpawnMode.ReferenceRoot : spawnMode,
        );

        this.children.forEach((child) =>
        {
            const childComponent = child.copy(spawnMode, false);

            childComponent.setParent(component);
        });

        return component as unknown as T;
    }

    protected setSpawner(spawner: Component<M, V>, spawnMode: SpawnMode)
    {
        this.spawner = spawner;
        spawner.spawned.push(this);

        const { model: sourceModel } = spawner;

        if (spawnMode === SpawnMode.Variant || spawnMode === SpawnMode.ReferenceRoot)
        {
            this.model.link(sourceModel);
        }
        else if (spawnMode === SpawnMode.Duplicate)
        {
            const sourceValues = sourceModel.values;

            this.model.setValues(sourceValues);
        }

        spawner.on('childAdded', this.onSpawnerChildAdded);
        spawner.on('childRemoved', this.onSpawnerChildRemoved);

        // this.on('childAdded', spawner.onSpawnerChildAdded);
        // this.on('childRemoved', spawner.onSpawnerChildRemoved);
    }

    protected onSpawnerChildAdded = (component: AnyComponent) =>
    {
        const copy = component.copy(this.spawnMode === SpawnMode.ReferenceRoot ? SpawnMode.Reference : this.spawnMode);

        this.addChild(copy);
    };

    protected onSpawnerChildRemoved = (component: AnyComponent) =>
    {
        this.children.forEach((child: AnyComponent) =>
        {
            if (child.spawner === component)
            {
                child.deleteSelf();
            }
        });
    };

    public dispose()
    {
        this.model.off('modified', this.onModelModified);

        if (this.spawner)
        {
            this.unlink();
        }

        this.emit('disposed');

        this.spawned.forEach((component) => component.unlink());
        this.children.forEach((child) => child.dispose());
    }

    public unlink(unlinkChildren = true)
    {
        const { model, spawner, spawnMode } = this;

        if (spawner)
        {
            if (spawnMode === SpawnMode.Variant && model.parent)
            {
                model.flatten();

                delete this.spawner;

                this.emit('unlinked');
            }
            else if (spawnMode === SpawnMode.Reference)
            {
                this.model = spawner.model.copy();
                this.initModel();
            }

            spawner.off('childAdded', this.onSpawnerChildAdded);
            spawner.off('childRemoved', this.onSpawnerChildRemoved);
        }

        if (unlinkChildren)
        {
            this.children.forEach((child) => child.unlink());
        }
    }

    public deleteSelf()
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
            this.dispose();
        }
    }

    public getRoot<T extends AnyComponent>(): T
    {
        if (!this.parent)
        {
            return this as unknown as T;
        }

        let ref: AnyComponent | undefined = this.parent;

        while (ref)
        {
            ref = ref.parent;
        }

        return ref as unknown as T;
    }

    public setParent(component: AnyComponent)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        this.parent = component;
        component.children.push(this);
        component.emit('childAdded', this);

        this.onAddedToParent();
    }

    public addChild(component: AnyComponent)
    {
        if (component === this)
        {
            throw new Error('"Cannot add component to self"');
        }

        component.setParent(this);
    }

    public removeChild(component: AnyComponent)
    {
        const { children } = this;
        const index = children.indexOf(component);

        if (index > -1)
        {
            component.onRemoveFromParent();
            children.splice(index, 1);
            delete component.parent;
            this.emit('childRemoved', component);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    public getChildAt<T extends AnyComponent>(index: number): T
    {
        return this.children[index] as T;
    }

    public walk(fn: (component: AnyComponent) => void, includeSelf = true)
    {
        if (includeSelf)
        {
            fn(this);
        }
        this.children.forEach((child) => child.walk(fn));
    }

    public containsChild(component: AnyComponent)
    {
        return this.children.indexOf(component) > -1;
    }

    protected onAddedToParent(): void
    {
        // subclasses
    }

    protected onRemoveFromParent()
    {
        // subclasses
    }

    public abstract update(): void;

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}
