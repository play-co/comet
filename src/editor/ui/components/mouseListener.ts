import Events from '../../events';

const mousePos = {
    clientX: 0,
    clientY: 0,
};

const root = document.body;

root.addEventListener('mousedown', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.down.emit(e);
});

root.addEventListener('mousemove', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.move.emit(e);
});

root.addEventListener('mouseup', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.up.emit(e);
});

export function mouseClientPos()
{
    return { x: mousePos.clientX, y: mousePos.clientY };
}
