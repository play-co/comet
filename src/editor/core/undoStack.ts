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

    public exec<R = unknown>(command: Command, isUndoRoot = true): R
    {
        command.isUndoRoot = isUndoRoot;

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
        const { stack, head, nextUndoRootIndex } = this;

        if (stack.length === 0 || head === -1)
        {
            return;
        }

        const headStart = head;

        for (let i = headStart; i >= nextUndoRootIndex; i--)
        {
            const cmd = stack[i];

            cmd.undo();

            globalEmitter.emit('command.undo', cmd);
        }

        this.head = nextUndoRootIndex - 1;
    }

    public redo()
    {
        const { commands } = this.nextRedoCommands;

        for (const cmd of commands)
        {
            cmd.redo();

            globalEmitter.emit('command.redo', cmd);

            this.head++;
        }
    }

    public apply()
    {
        const { commands } = this.nextRedoCommands;

        for (const cmd of commands)
        {
            cmd.apply();
            this.head++;
        }
    }

    public get isHeadAtEnd()
    {
        return this.head === this.stack.length - 1;
    }

    public get isEmpty()
    {
        return this.stack.length === 0;
    }

    public get nextRedoCommands(): {head: number; commands: Command[]}
    {
        const { stack, head, isHeadAtEnd, isEmpty, nextRedoRootIndex } = this;
        const commands: Command[] = [];

        if (isHeadAtEnd || isEmpty)
        {
            return { head: stack.length - 1, commands };
        }

        let newHead = head;

        const headStart = nextRedoRootIndex;

        for (let i = headStart; i < stack.length; i++)
        {
            const cmd = stack[i];

            if (cmd.isUndoRoot && i > headStart)
            {
                break;
            }

            newHead = i;

            commands.push(cmd);
        }

        return { head: newHead, commands };
    }

    public get nextUndoRootIndex()
    {
        const { head, stack } = this;

        for (let i = head; i >= 0; i--)
        {
            if (stack[i].isUndoRoot)
            {
                return i;
            }
        }

        return head;
    }

    public get nextRedoRootIndex()
    {
        const { head, stack } = this;

        for (let i = head + 1; i < stack.length; i++)
        {
            if (stack[i].isUndoRoot)
            {
                return i;
            }
        }

        return stack.length - 1;
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

    protected get peek(): Command | null
    {
        const { stack } = this;

        return stack.length ? stack[this.stack.length - 1] : null;
    }

    public toJSON(): object[]
    {
        return this.stack.flat().map((cmd) => cmd.toJSON());
    }

    public debugPrint()
    {
        const { head, stack } = this;

        const array = stack.map((command, i) =>
        {
            const cmdName = `[${i}]:${command.name}`;
            const cmd = command.isUndoRoot ? [`✅${cmdName}`] : [cmdName];

            if (i === head)
            {
                return [`<b style="color:white">${cmd}</b>`];
            }

            return cmd;
        }).flat(5);

        return `@${head}~${array.join(' / ')}`;
    }
}
