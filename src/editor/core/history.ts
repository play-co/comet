import { Application } from './application';
import { getUserName } from '../sync/user';
import { createCommand } from './commandFactory';
import { commandHistoryKey, undoHistoryKey } from './localStorage';

const userName = getUserName();

export function initHistory()
{
    if (localStorage['saveUndo'] === '0')
    {
        localStorage['replayIndex'] = '0';
    }
    else
    {
        localStorage[commandHistoryKey] = '[]';
        localStorage.removeItem('replayIndex');
    }
}

export function writeUndoStack()
{
    const data = JSON.stringify(Application.instance.undoStack.toJSON(), null, 4);

    localStorage[undoHistoryKey] = data;
}

export function writeCommandList(commandName: string)
{
    if (localStorage['saveUndo'] === '0')
    {
        return;
    }

    const commandList = JSON.parse(localStorage[commandHistoryKey] || '[]') as string[];

    commandList.push(`${userName}:${commandName}`);
    localStorage[commandHistoryKey] = JSON.stringify(commandList);
}

export function readUndoStack(endIndex: number | undefined = undefined)
{
    const data = localStorage[undoHistoryKey];

    if (data)
    {
        const { undoStack } = Application.instance;
        let commandArray = JSON.parse(data) as any[];

        commandArray = commandArray.slice(0, endIndex === 0 ? undefined : endIndex);

        const commands = commandArray.map((commandJSON) =>
            createCommand(commandJSON));

        undoStack.stack.length = 0;
        undoStack.stack.push(...commands);
        undoStack.head = -1;
    }
}
