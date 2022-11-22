// implicitly register all core node types, editor must also register types
import './core/nodeRegistry';
// styles
import './style';

import { Application } from './application';

// eslint-disable-next-line no-new
new Application({});

import App from './views/App.svelte';

const target = document.getElementById('app') as HTMLElement;

const app = new App({
    target,
});

export default app;

