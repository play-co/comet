import type { ClonableNode } from '../../../core';
import { getGlobalEmitter } from '../../../core/events';
import type { PropertyCategory } from '../../../core/model/schema';
import { Application } from '../../core/application';
import type { SelectionEvent } from '../../events/selectionEvents';
import DisplayPanel from './components/propertyPanels/display.svelte';
import GridPanel from './components/propertyPanels/grid.svelte';
import ProjectPanel from './components/propertyPanels/project.svelte';
import TransformPanel from './components/propertyPanels/transform.svelte';
import { WritableStore } from './store';

type PanelCategory = PropertyCategory | 'project' | 'grid';

export const PropertyPanelComponents: Partial<Record<PropertyCategory, ConstructorOfATypedSvelteComponent>> = {
    transform: TransformPanel,
    display: DisplayPanel,
};

export const PropertyCategoryOrder: PropertyCategory[] = [
    'display',
    'transform',
    'text',
    'texture',
];

export class PropertyBinding
{
    public key: string;
    public bindings: ClonableNode[];

    constructor(propertyKey: string)
    {
        this.key = propertyKey;
        this.bindings = [];
    }

    public addNode(node: ClonableNode)
    {
        this.bindings.push(node);
    }
}

export interface PropertiesPanel
{
    category: PanelCategory;
    properties: PropertyBinding[];
    component: ConstructorOfATypedSvelteComponent;
}

const projectPanel: PropertiesPanel =  {
    category: 'project',
    properties: [],
    component: ProjectPanel,
};

const gridPanel: PropertiesPanel =  {
    category: 'grid',
    properties: [],
    component: GridPanel,
};

function createController()
{
    const { selection } = Application.instance;

    const panels = new WritableStore<PropertiesPanel[]>([]);

    const selectionEmitter = getGlobalEmitter<SelectionEvent>();

    function update()
    {
        // go through each selected node
        // collect all properties which are not hidden
        // create panel and give properties

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

        const array = [];

        for (const [category, propertyBindingsByKey] of categories.entries())
        {
            const properties = [...propertyBindingsByKey.values()];
            const component = PropertyPanelComponents[category];

            if (!component)
            {
                // throw new Error(`Property panel "${category}" not found`);
                continue;
            }

            const panel: PropertiesPanel = {
                category,
                properties,
                component,
            };

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

