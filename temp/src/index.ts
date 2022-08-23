import { Sub2 } from 'player';

const node = new Sub2();
const inst = node.clone<Sub2>();

inst.on('get', (key: string, value: any) => console.log('GET:', key, value));
inst.on('set', (key: string, value: any) => console.log('SET:', key, value));

console.log(inst.$baseVisibleProp);
console.log(inst.baseProp);
console.log(inst.$sub1VisibleProp);
console.log(inst.$sub2VisibleProp);

inst.$baseVisibleProp = 'overrideBaseVisibleProp';
inst.baseProp = 'overrideBaseProp';
inst.$sub1VisibleProp = 'overrideSub1VisibleProp';
inst.$sub2VisibleProp = 'overrideSub2VisibleProp';

