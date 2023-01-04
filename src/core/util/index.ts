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

export function pollUntil(predicate: () => boolean, interval = 50, timeout = 3000)
{
    return new Promise((resolve, reject) =>
    {
        const start = Date.now();

        const poll = () =>
        {
            let result = false;

            try
            {
                result = predicate();
            }
            catch (e)
            {
                result = false;
            }

            if (result)
            {
                resolve(undefined);
            }
            else if (Date.now() - start > timeout)
            {
                reject(new Error('timeout'));
            }
            else
            {
                setTimeout(poll, interval);
            }
        };

        poll();
    });
}
