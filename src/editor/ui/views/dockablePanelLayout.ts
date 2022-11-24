import { GoldenLayout, type ComponentContainer, type LayoutConfig } from 'golden-layout';
import PropertiesPanel from './propertiesPanel.svelte';

function createPanelFactory<T>(Ctor: { new(params: { target: HTMLElement }): T }) {
    return function factoryFunc(container: ComponentContainer) {
        new Ctor({
            target: container.element,
        });
    }
}

const layoutConfig: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            {
                title: 'PropertiesPanel1',
                type: 'component',
                componentType: 'PropertiesPanel',
                width: 50,
                // header: {
                //     show: false,
                // },
                isClosable: false,
            },
            {
                title: 'PropertiesPanel2',
                type: 'component',
                componentType: 'PropertiesPanel',
                // componentState: { text: 'Component 2' },
            },
        ],
        isClosable: false,
    },
};

export function createLayout(container: HTMLElement) {
    const layout = new GoldenLayout(container);

    layout.resizeWithContainerAutomatically = true;
    
    layout.registerComponentFactoryFunction('PropertiesPanel', createPanelFactory(PropertiesPanel))
    
    layout.loadLayout(layoutConfig);

    // layout.addComponent('MyComponent', undefined, 'Added Component');

    return layout;
}