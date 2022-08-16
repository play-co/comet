export function radToDeg(rad: number)
{
    return rad * (180 / Math.PI);
}

export function degToRad(deg: number)
{
    return deg * (Math.PI / 180);
}

export function distance(x1: number, y1: number, x2: number, y2: number)
{
    const x = Math.abs(x2 - x1);
    const y = Math.abs(y2 - y1);

    return Math.sqrt((y * y) + (x * x));
}

export function polarPoint(deg: number, length: number)
{
    const x = length * Math.cos(degToRad(deg));
    const y = length * Math.sin(degToRad(deg));

    return [x, y];
}
