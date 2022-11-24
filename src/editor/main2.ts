import './style';
import './core/nodeRegistry';

import type { ComponentContainer, ComponentItemConfig, LayoutConfig } from 'golden-layout';
import { GoldenLayout } from 'golden-layout';

import { Application } from './core/application';

// eslint-disable-next-line no-new
new Application({});

import PropertiesPanel from './ui/views/propertiesPanel.svelte';

const component1: ComponentItemConfig = {
    title: 'My Component 1',
    type: 'component',
    componentType: 'MyComponent',
    width: 50,
    // header: {
    //     show: false,
    // },
    isClosable: false,
};

const component2: ComponentItemConfig = {
    title: 'My Component 2',
    type: 'component',
    componentType: 'MyComponent',
    componentState: { text: 'Component 2' },
};

const myLayout: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            component1,
            component2,
        ],
        isClosable: false,
    },
};

const addMenuItemElement = document.querySelector('#addMenuItem') as HTMLElement;
const layoutElement = document.querySelector('#layoutContainer') as HTMLElement;

const layout = new GoldenLayout(layoutElement);
layout.resizeWithContainerAutomatically = true;

addMenuItemElement.addEventListener('click', (event) =>
{
    layout.addComponent('MyComponent', undefined, 'Added Component');
});

function createPanelFactory<T>(Ctor: { new(params: { target: HTMLElement }): T }) {
    return function factoryFunc(container: ComponentContainer) {
        new Ctor({
            target: container.element,
        });
    }
}

// layout.registerComponentConstructor('MyComponent', SvelteComponent);
layout.registerComponentFactoryFunction('MyComponent', createPanelFactory(PropertiesPanel))

layout.loadLayout(myLayout);

// console.log(layout.saveLayout());