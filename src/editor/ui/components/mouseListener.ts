import Events from '../../events';

const mousePos = {
    clientX: 0,
    clientY: 0,
};

window.addEventListener('mousedown', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.down.emit(e);
});

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.move.emit(e);
});

window.addEventListener('mouseup', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;

    Events.mouse.up.emit(e);
});

export function mouseClientPos()
{
    return { x: mousePos.clientX, y: mousePos.clientY };
}
