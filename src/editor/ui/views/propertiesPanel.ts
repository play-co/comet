import type { ClonableNode } from '../../../core';
import { getGlobalEmitter } from '../../../core/events';
import type { PropertyCategory } from '../../../core/model/schema';
import { Application } from '../../core/application';
import type { SelectionEvent } from '../../events/selectionEvents';
import DisplayPanel from './components/propertyPanels/displayPanel.svelte';
import GridPanel from './components/propertyPanels/gridPanel.svelte';
import ProjectPanel from './components/propertyPanels/projectPanel.svelte';
import TransformPanel from './components/propertyPanels/transformPanel.svelte';
import { WritableStore } from './store';

type PanelCategory = PropertyCategory | 'project' | 'grid';

export const PropertyPanelComponents: Partial<Record<PropertyCategory, ConstructorOfATypedSvelteComponent>> = {
    transform: TransformPanel,
    display: DisplayPanel,
};

export const PropertyCategoryOrder: PropertyCategory[] = [
    'transform',
    'display',
    'text',
    'texture',
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
    public component: ConstructorOfATypedSvelteComponent;

    constructor(category: PanelCategory, properties: PropertyBinding[], component: ConstructorOfATypedSvelteComponent)
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
    const { selection } = Application.instance;

    const panels = new WritableStore<PropertiesPanel[]>([]);

    const selectionEmitter = getGlobalEmitter<SelectionEvent>();

    function update()
    {
        const categories: Map<PropertyCategory, Map<string, PropertyBinding>> = new Map();

        selection.nodes.forEach((node) =>
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
                // throw new Error(`Property panel "${category}" not found`);
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

    selectionEmitter
        .on('selection.add', update)
        .on('selection.set.single', update)
        .on('selection.set.multi', update)
        .on('selection.deselect', clear);

    // start with unselected state
    clear();

    return {
        store: {
            panels: panels.store,
        },
    };
}

export { createController };

