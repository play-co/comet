// import { Application } from 'pixi.js';

import { Sub2 } from '../core/nodes/sub2';
// const app = new Application();

// console.log('app:', app);

const node = new Sub2();

console.log(node);
// const inst = node.clone<Sub2>();

// inst.on('get', (key: string, value: any) => console.log('GET:', key, value));
// inst.on('set', (key: string, value: any) => console.log('SET:', key, value));

// console.log(inst.$baseVisibleProp);
// console.log(inst.baseProp);
// console.log(inst.$sub1VisibleProp);
// console.log(inst.$sub2VisibleProp);

// inst.$baseVisibleProp = 'overrideBaseVisibleProp';
// inst.baseProp = 'overrideBaseProp';
// inst.$sub1VisibleProp = 'overrideSub1VisibleProp';
// inst.$sub2VisibleProp = 'overrideSub2VisibleProp';

export { Sub2 };
