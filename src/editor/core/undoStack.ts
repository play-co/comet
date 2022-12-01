import { getGlobalEmitter } from '../../core/events';
import type { Command } from '../core/command';
import type { CommandEvent } from '../events/commandEvents';
import { getUserLogColor, getUserName } from '../sync/user';
import { writeCommandList, writeUndoStack } from './history';

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:yellow;';

const globalEmitter = getGlobalEmitter<CommandEvent>();

export default class UndoStack
{
    public stack: Command[];
    public head: number;

    constructor()
    {
        this.stack = [];
        this.head = -1;
    }

    public get length()
    {
        return this.stack.length;
    }

    public exec<R = unknown>(command: Command): R
    {
        writeCommandList(command.name);

        this.push(command);

        if (localStorage['saveUndo'] !== '0')
        {
            writeUndoStack();
        }

        console.group(`%c${logId}:%c🔔 ${command.name}.run()`, userColor, `font-weight:bold;${logStyle}`);
        console.log(`%c${JSON.stringify(command.params)}`, 'color:#999');

        const result = command.run();

        console.groupEnd();

        return result as unknown as R;
    }

    public indexOf(command: Command)
    {
        return this.stack.indexOf(command);
    }

    public getCommandAt(index: number): Command | undefined
    {
        return this.stack[index];
    }

    public push(command: Command)
    {
        const { stack, head } = this;

        if (head >= -1 && head < stack.length - 1)
        {
            const deleteCount = stack.length - 1 - head;

            stack.splice(head + 1, deleteCount);
        }

        stack.push(command);

        this.head++;
    }

    public undo()
    {
        const { stack, head } = this;

        if (stack.length === 0 || head === -1)
        {
            return;
        }

        const command = stack[head];

        command.undo();

        globalEmitter.emit('command.undo', command);

        this.head -= 1;
    }

    public redo()
    {
        const { stack, head } = this;

        if (stack.length === 0 || head === stack.length - 1)
        {
            return;
        }

        const command = stack[head + 1];

        command.redo();

        globalEmitter.emit('command.redo', command);

        this.head++;
    }

    public apply()
    {
        const { stack, head } = this;
        const command = stack[head];

        command.apply();

        this.head++;
    }

    public get isHeadAtEnd()
    {
        return this.head === this.stack.length - 1;
    }

    public get isEmpty()
    {
        return this.stack.length === 0;
    }

    public get hasCommands()
    {
        return this.head > -1;
    }

    public clear()
    {
        this.stack.length = 0;
        this.head = -1;
    }

    public toJSON(): object[]
    {
        return this.stack.flat().map((cmd) => cmd.toJSON());
    }
}
