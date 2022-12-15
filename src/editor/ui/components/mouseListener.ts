const mousePos = {
    clientX: 0,
    clientY: 0,
};

window.addEventListener('mousemove', (e: MouseEvent) =>
{
    mousePos.clientX = e.clientX;
    mousePos.clientY = e.clientY;
});

export function mouseClientPos()
{
    return { x: mousePos.clientX, y: mousePos.clientY };
}
