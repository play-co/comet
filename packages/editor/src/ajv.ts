// import schema from './schema';
// import { getProperties, getSchemaValidator } from './typeUtil';
import { Sub2 } from './core/nodes/sub2';

const node = new Sub2();
const inst = node.create<Sub2>();

inst.on('get', (key, value) => console.log('GET', key, value));
inst.on('set', (key, value) => console.log('SET', key, value));

console.log('log', inst.baseProp);
console.log('log', inst._basePrivate);
console.log('log', inst.sub1Prop);
console.log('log', inst.sub2Prop);

inst.baseProp = 'overrideBaseProp';
inst.sub1Prop = 'overrideSub1Prop';
inst.sub2Prop = 'overrideSub2Prop';
