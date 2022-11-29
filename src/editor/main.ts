// implicitly register all core node types, editor must also register types
import './core/nodeRegistry';
// styles
import './style';

import { Application } from './core/application';
// main app and tools
import { inspectDatastoreNodes } from './devTools/inspectDatastore';
import { inspectGraphNodes } from './devTools/inspectGraphNodes';

(window as any).inspect = {
    all: () =>
    {
        console.clear();
        inspectGraphNodes();
        inspectDatastoreNodes();
    },
    graph: {
        nodes: () => inspectGraphNodes(),
    },
    datastore: {
        nodes: () => inspectDatastoreNodes(),
    },

};

// eslint-disable-next-line no-new
new Application({});

import App from './ui/views/app.svelte';

const target = document.getElementById('app') as HTMLElement;

const app = new App({
    target,
});

export default app;

