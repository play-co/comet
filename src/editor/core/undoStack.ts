import { log } from '../../core/log';
import type { Command } from '../core/command';
import Events from '../events';
import { writeCommandList, writeUndoStack } from './history';

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

    public exec<CommandReturnType = unknown>(command: Command): CommandReturnType
    {
        writeCommandList(command.name);

        this.push(command);

        if (localStorage['saveUndo'] !== '0')
        {
            writeUndoStack();
        }

        command.storeSelection();

        log('command', 'exec', command.toJSON());

        const result = command.run();

        Events.command.exec.emit(command);

        return result as unknown as CommandReturnType;
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

        log('command', 'undo', command.toJSON());

        command.undo();

        command.restoreSelection('undo');

        Events.command.undo.emit(command);

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

        log('command', 'redo', command.toJSON());

        command.redo();

        command.restoreSelection('redo');

        Events.command.redo.emit(command);

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
