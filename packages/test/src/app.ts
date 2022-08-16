import { Application } from 'pixi.js';

export const app: Application = new Application({
    backgroundColor: 0xff0000,
});

export function create(container: HTMLElement)
{
    app.resizeTo = container;
    container.appendChild(app.view);
}
