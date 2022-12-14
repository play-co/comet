export interface MouseDragInitialiser
{
    event: MouseEvent;
    startX?: number;
    startY?: number;
}

export interface MouseDragUpdate
{
    event: MouseEvent;
    currentX: number;
    currentY: number;
    deltaX: number;
    deltaY: number;
}

export function mouseDrag(
    initialiser: MouseDragInitialiser,
    onMove?: (update: MouseDragUpdate) => void,
): Promise<MouseDragUpdate>
{
    return new Promise((resolve) =>
    {
        const { startX, startY, event } = initialiser;
        const { clientX: startClientX, clientY: startClientY } = event;

        const onMouseMove = (e: MouseEvent) =>
        {
            const deltaX = e.clientX - startClientX;
            const deltaY = e.clientY - startClientY;

            if (onMove)
            {
                onMove({ event: e, currentX: (startX ?? 0) + deltaX, currentY: (startY ?? 0) + deltaY, deltaX, deltaY });
            }
        };

        const onMouseUp = (e: MouseEvent) =>
        {
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);

            const deltaX = e.clientX - startClientX;
            const deltaY = e.clientY - startClientY;

            resolve({ event: e, currentX: (startX ?? 0) + deltaX, currentY: (startY ?? 0) + deltaY, deltaX, deltaY });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}
