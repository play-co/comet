export type WalkReturnData = Record<string, any>;

export interface WalkOptions
{
    includeSelf?: boolean;
    depth: number;
    cancel: boolean;
    direction: 'up' | 'down';
    data: WalkReturnData;
}

export const defaultWalkOptions: WalkOptions = {
    includeSelf: true,
    depth: 0,
    cancel: false,
    direction: 'down',
    data: {},
};

export const sortNodesByCreation = (a: {created: number; id: string}, b: {created: number; id: string}) =>
{
    const aCreation = a.created;
    const bCreation = b.created;

    // sort by creation
    if (aCreation < bCreation)
    {
        return -1;
    }
    else if (aCreation > bCreation)
    {
        return 1;
    }

    // if creation is equal sort by id index
    const aIdIndex = parseInt(a.id.split(':')[1]);
    const bIdIndex = parseInt(b.id.split(':')[1]);

    if (aIdIndex <= bIdIndex)
    {
        return -1;
    }

    return 1;
};
