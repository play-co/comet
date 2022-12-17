export function delay(ms: number)
{
    return new Promise((resolve) =>
    {
        setTimeout(() => resolve(undefined), ms);
    });
}

export function nextTick()
{
    return delay(0);
}
