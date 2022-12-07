import Events from '../../events';

const keyMap: Map<string, boolean> = new Map();

window.addEventListener('keydown', (e: KeyboardEvent) =>
{
    const { key } = e;

    if (!keyMap.has(key))
    {
        keyMap.set(key, true);

        Events.key.down.emit(e);
    }
});

window.addEventListener('keyup', (e: KeyboardEvent) =>
{
    const { key } = e;

    keyMap.delete(key);

    Events.key.up.emit(e);
});

export function isKeyPressed(key: string)
{
    if (!keyMap.has(key))
    {
        return false;
    }

    return keyMap.get(key) as boolean;
}
