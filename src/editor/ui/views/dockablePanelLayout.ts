import { type ComponentContainer, type LayoutConfig, GoldenLayout } from 'golden-layout';

import HierarchyPanel from './hierarchyPanel.svelte';
import ProjectPanel from './projectPanel.svelte';
import PropertiesPanel from './propertiesPanel.svelte';

function createPanelFactory<T>(Ctor: { new(params: { target: HTMLElement }): T })
{
    return function factoryFunc(container: ComponentContainer)
    {
        // eslint-disable-next-line no-new
        new Ctor({
            target: container.element,
        });
    };
}

const layoutConfig: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            {
                title: 'Hierarchy',
                type: 'component',
                componentType: 'HierarchyPanel',
                // width: 30,
                size: '1fr',
                isClosable: false,
                minSize: '250px',
            },
            {
                type: 'column',
                id: 'foo',
                size: '2fr',
                content: [

                ],
            },
            {
                title: 'Properties',
                type: 'component',
                componentType: 'PropertiesPanel',
                minSize: '250px',
            },
        ],
    },
    dimensions: {
        headerHeight: 30,
    },
};

export function createLayout(container: HTMLElement)
{
    const layout = new GoldenLayout(container);

    layout.resizeWithContainerAutomatically = true;

    layout.registerComponentFactoryFunction('PropertiesPanel', createPanelFactory(PropertiesPanel));
    layout.registerComponentFactoryFunction('ProjectPanel', createPanelFactory(ProjectPanel));
    layout.registerComponentFactoryFunction('HierarchyPanel', createPanelFactory(HierarchyPanel));

    layout.loadLayout(layoutConfig);

    // layout.addComponent('MyComponent', undefined, 'Added Component');

    return layout;
}
