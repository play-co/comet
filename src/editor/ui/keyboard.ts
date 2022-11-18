import { getGlobalEmitter } from '../../core/events';
import type { GlobalKeyboardEvent } from '../events/keyboardEvents';

const keyMap: Map<string, boolean> = new Map();

const globalEmitter = getGlobalEmitter<GlobalKeyboardEvent>();

window.addEventListener('keydown', (e: KeyboardEvent) =>
{
    const { key } = e;

    if (!keyMap.has(key))
    {
        keyMap.set(key, true);

        globalEmitter.emit('key.down', { key });
    }
});

window.addEventListener('keyup', (e: KeyboardEvent) =>
{
    const { key } = e;

    keyMap.set(key, false);

    globalEmitter.emit('key.up', { key });
});

export function isKeyPressed(key: string)
{
    if (!keyMap.has(key))
    {
        return false;
    }

    return keyMap.get(key) as boolean;
}
