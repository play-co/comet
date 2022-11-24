interface EventData
{
    key: string;
}

export interface GlobalKeyboardEvent
{
    'key.down': EventData;
    'key.up': EventData;
}
