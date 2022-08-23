<script lang="ts">
    import * as Y from 'yjs';
    import { WebsocketProvider } from 'y-websocket';

    const doc = new Y.Doc();

    const wsProvider = new WebsocketProvider(
        'ws://localhost:1234',
        'test',
        doc,
    );

    wsProvider.on('status', (event: any) => {
        console.log(event.status); // logs "connected" or "disconnected"
    });

    const yarray = doc.getArray('my-array');

    yarray.observe((_event: any) => {
        console.log('yarray was modified', yarray.toArray());
        count = yarray.toArray() as number[];
    });

    let count: number[] = yarray.toArray() as number[];

    const increment = () => {
        count = yarray.toArray() as number[];
        yarray.insert(0, [yarray.length]); // => "yarray was modified"
    };

    const awareness = wsProvider.awareness;

    const cursors: Record<string, HTMLElement> = {};

    awareness.on('change', (_changes: any) => {
        const states = Array.from(awareness.getStates().values());
        states.forEach((state: any) => {
            const {
                user: { name },
                cursor,
            } = state;
            if (!cursors[name]) {
                const element = document.createElement('div');
                element.style.cssText = `width:20px;height:20px;background-color:${name};position:absolute;margin-top:-10px;margin-left:-10px;pointer-events:none;`;
                document.body.appendChild(element);
                cursors[name] = element;
            }
            if (cursor) {
                const element = cursors[name];
                element.style.left = `${cursor.x}px`;
                element.style.top = `${cursor.y}px`;
            }
        });

        // console.log('Awareness change', states);
    });

    awareness.setLocalStateField('user', {
        name: window.location.hash.replace('#', ''),
    });

    window.onmousemove = (e: MouseEvent) => {
        awareness.setLocalStateField('cursor', {
            x: e.clientX,
            y: e.clientY,
        });
    };
</script>

<button on:click={increment}>
    count is {count}
</button>
