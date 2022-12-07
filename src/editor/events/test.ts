import { Emit } from './emitter';

const events = {
    foo: Emit<{x: number}>(),
};

const handler = (e: typeof events.foo.type) =>
{
    console.log(e.x);
};

const badHandler = (e: string) => { console.log('!'); };

events.foo.bind(handler);
events.foo.bind(badHandler);

events.foo.emit({ x: 1 });
