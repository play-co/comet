import './theme.css';
import './app.css';

import App from './App.svelte';

const target = document.getElementById('app') as HTMLElement;

const app = new App({
    target,
});

export default app;

console.log('!!!!');
