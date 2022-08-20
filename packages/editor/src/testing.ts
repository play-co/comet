import { Sub2 } from 'core';

const node = new Sub2();
const inst = node.create<Sub2>();

inst.on('get', (key: string, value: any) => console.log('GET', key, value));
inst.on('set', (key: string, value: any) => console.log('SET', key, value));

console.log('log', inst.$baseVisibleProp);
console.log('log', inst.baseProp);
console.log('log', inst.$sub1VisibleProp);
console.log('log', inst.$sub2VisibleProp);

inst.$baseVisibleProp = 'overrideBaseVisibleProp';
inst.baseProp = 'overrideBaseProp';
inst.$sub1VisibleProp = 'overrideSub1VisibleProp';
inst.$sub2VisibleProp = 'overrideSub2VisibleProp';
inst.foo();
