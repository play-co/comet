import './style';
import './core/nodeRegistry';

import type { ComponentContainer, ComponentItemConfig, LayoutConfig } from 'golden-layout';
import { GoldenLayout, ItemType } from
    'golden-layout';

import { Application } from './core/application';

// eslint-disable-next-line no-new
new Application({});

import PropertiesPanel from './ui/views/propertiesPanel.svelte';

class SvelteComponent
{
    public resizeWithContainerAutomatically: boolean;

    constructor(public container: ComponentContainer)
    {
        console.log(container);
        this.resizeWithContainerAutomatically = true;
        const component = new PropertiesPanel({
            target: container.element,
        });
    }
}

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
    },
};

const addMenuItemElement = document.querySelector('#addMenuItem') as HTMLElement;
const layoutElement = document.querySelector('#layoutContainer') as HTMLElement;

const goldenLayout = new GoldenLayout(layoutElement);

addMenuItemElement.addEventListener('click', (event) =>
{
    goldenLayout.addComponent('MyComponent', undefined, 'Added Component');
});

goldenLayout.registerComponentConstructor('MyComponent', SvelteComponent);

goldenLayout.loadLayout(myLayout);
