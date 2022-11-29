export function mouseDrag(
    e: MouseEvent,
    onMove?: (deltaX: number, deltaY: number, startX: number, startY: number) => void,
): Promise<{deltaX: number; deltaY: number}>
{
    return new Promise((resolve) =>
    {
        const startX = e.clientX;
        const startY = e.clientY;

        const onMouseMove = (e: MouseEvent) =>
        {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (onMove)
            {
                onMove(deltaX, deltaY, startX, startY);
            }
        };

        const onMouseUp = (e: MouseEvent) =>
        {
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            resolve({ deltaX, deltaY });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}
