import type { ComponentType } from 'svelte';

import type { ClonableNode } from '../../../core';
import type { PropertyCategory } from '../../../core/model/schema';
import { Application } from '../../core/application';
import Events from '../../events';
import DisplayPanel from './components/propertyPanels/displayProperties.svelte';
import GridPanel from './components/propertyPanels/gridProperties.svelte';
import ProjectPanel from './components/propertyPanels/projectProperties.svelte';
import TexturePanel from './components/propertyPanels/textureProperties.svelte';
import TransformPanel from './components/propertyPanels/transformProperties.svelte';
import { WritableStore } from './store';

type PanelCategory = PropertyCategory | 'project' | 'grid';

export const mixedToken = 'mixed';

export const PropertyPanelComponents: Partial<Record<PropertyCategory, ComponentType>> = {
    transform: TransformPanel,
    display: DisplayPanel,
    texture: TexturePanel,
};

export const PropertyCategoryOrder: PropertyCategory[] = [
    'display',
    'transform',
    'texture',
    'text',
];

export class PropertyBinding
{
    public key: string;
    public nodes: ClonableNode[];

    constructor(propertyKey: string)
    {
        this.key = propertyKey;
        this.nodes = [];
    }

    public addNode(node: ClonableNode)
    {
        this.nodes.push(node);
    }
}

export class PropertiesPanel
{
    public category: PanelCategory;
    public properties: PropertyBinding[];
    public component: ComponentType;

    constructor(category: PanelCategory, properties: PropertyBinding[], component: ComponentType)
    {
        this.category = category;
        this.properties = properties;
        this.component = component;
    }
}

const projectPanel = new PropertiesPanel('project', [], ProjectPanel);

const gridPanel = new PropertiesPanel('grid', [], GridPanel);

function createController()
{
    const { hierarchy: selection } = Application.instance.selection;

    const panels = new WritableStore<PropertiesPanel[]>([]);

    function update()
    {
        const categories: Map<PropertyCategory, Map<string, PropertyBinding>> = new Map();

        selection.items.forEach((node) =>
        {
            for (const [propertyKey, propertyDescriptor] of Object.entries(node.model.schema.properties))
            {
                const { category } = propertyDescriptor;

                if (!categories.has(category))
                {
                    categories.set(category, new Map());
                }

                const propertyBindingsByKey = categories.get(category) as Map<string, PropertyBinding>;

                if (!propertyBindingsByKey.has(propertyKey))
                {
                    propertyBindingsByKey.set(propertyKey, new PropertyBinding(propertyKey));
                }

                const propertyBinding = propertyBindingsByKey.get(propertyKey) as PropertyBinding;

                propertyBinding.addNode(node.asClonableNode());
            }
        });

        const array: PropertiesPanel[] = [];

        for (const [category, propertyBindingsByKey] of categories.entries())
        {
            const properties = [...propertyBindingsByKey.values()];
            const component = PropertyPanelComponents[category];

            if (!component)
            {
                continue;
            }

            const panel = new PropertiesPanel(category, properties, component);

            array.push(panel);
        }

        array.sort((a, b) =>
        {
            const aIndex = PropertyCategoryOrder.indexOf(a.category as PropertyCategory);
            const bIndex = PropertyCategoryOrder.indexOf(b.category as PropertyCategory);

            return aIndex - bIndex;
        });

        panels.value = array;
    }

    function clear()
    {
        panels.value = [projectPanel, gridPanel];
    }

    // bind to events
    Events.$('selection.hierarchy.(add|remove|setSingle|setMulti)', update);
    Events.$('datastore.node.local.cloaked', update);
    Events.selection.hierarchy.deselect.bind(clear);

    // start with unselected state
    clear();

    return {
        store: {
            panels: panels.store,
        },
    };
}

export { createController };

