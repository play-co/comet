import type { ClonableNode } from '../../../core';
import { getGlobalEmitter } from '../../../core/events';
import type { PropertyCategory } from '../../../core/model/schema';
import { Application } from '../../core/application';
import type { SelectionEvent } from '../../events/selectionEvents';
import TransformPanel from './properties.transform.svelte';
import { WritableStore } from './store';

export class PropertyBinding
{
    public propertyKey: string;
    public bindings: ClonableNode[];

    constructor(propertyKey: string)
    {
        this.propertyKey = propertyKey;
        this.bindings = [];
    }

    public addNode(node: ClonableNode)
    {
        this.bindings.push(node);
    }
}

export interface PropertyPanel
{
    type: PropertyCategory;
    properties: PropertyBinding[];
}

function createController()
{
    const { selection } = Application.instance;

    const panels = new WritableStore<PropertyPanel[]>([]);

    const selectionEmitter = getGlobalEmitter<SelectionEvent>();

    function update()
    {
        // go through each selected node
        // collect all properties which are not hidden
        // create panel and give properties

        const categories: Map<string, Map<string, PropertyBinding>> = new Map();

        selection.nodes.forEach((node) =>
        {
            for (const [propertyKey, propertyDescriptor] of Object.entries(node.model.schema.properties))
            {
                const { category } = propertyDescriptor;

                if (!categories.has(category))
                {
                    categories.set(category, new Map());
                }

                const propertyBindings = categories.get(category) as Map<string, PropertyBinding>;

                if (!propertyBindings.has(propertyKey))
                {
                    propertyBindings.set(propertyKey, new PropertyBinding(propertyKey));
                }

                const propertyBinding = propertyBindings.get(propertyKey) as PropertyBinding;

                propertyBinding.addNode(node.asClonableNode());
            }
        });

        console.log(selection.nodes.length, categories);
    }

    selectionEmitter
        .on('selection.add', update)
        .on('selection.set.single', update)
        .on('selection.set.multi', update);

    return {
        store: {
            panels: panels.store,
        },
    };
}

export { createController };

