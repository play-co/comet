import EventEmitter from 'eventemitter3';

export interface EditableProp
{
    label: string;
    type: 'string' | 'number' | 'boolean';
}

export class BaseComponent extends EventEmitter<'modified'>
{
    public getEditableProperties(): EditableProp[]
    {
        return [];
    }

    public clone(other: this)
    {
        const Ctor = Object.getPrototypeOf(this).constructor as {
            new (): BaseComponent;
        };
        const component = new Ctor();

        // copy others values...
        (component as any).prop = (other as any).prop;

        return component;
    }

    public copy(linked = true): this
    {
        if (linked)
        {
            // if linked, return existing nodes
        }
        else
        {
            // otherwise return new cloned nodes
        }

        return {} as typeof this;
    }
}
