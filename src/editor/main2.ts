import './style';

import type { ComponentContainer, LayoutConfig } from 'golden-layout';
import { ComponentItemConfig, GoldenLayout, ItemType } from
    'golden-layout';

import { Application } from './core/application';

// eslint-disable-next-line no-new
new Application({});

import App from './ui/views/app.svelte';

class MyComponent
{
    public rootElement: HTMLElement;

    constructor(public container: ComponentContainer)
    {
        this.rootElement = container.element;
        this.rootElement.innerHTML = '<h2>' + 'Component Type: MyComponent' + '</h2>';
        (this as any).resizeWithContainerAutomatically = true;
    }
}

class PanelComponent
{
    public resizeWithContainerAutomatically: boolean;

    constructor(public container: ComponentContainer)
    {
        this.resizeWithContainerAutomatically = true;
        const app = new App({
            target: container.element,
        });
    }
}

const myLayout: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            {
                title: 'My Component 1',
                type: 'component',
                componentType: 'MyComponent',
                width: 50,
            },
            {
                title: 'My Component 2',
                type: 'component',
                componentType: 'MyComponent',
                // componentState: { text: 'Component 2' }
            },
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

goldenLayout.registerComponentConstructor('MyComponent', PanelComponent);

goldenLayout.loadLayout(myLayout);
