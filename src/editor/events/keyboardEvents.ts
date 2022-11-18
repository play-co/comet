interface CommandPayload
{
    key: string;
}

export interface GlobalKeyboardEvent
{
    'key.down': CommandPayload;
    'key.up': CommandPayload;
}
