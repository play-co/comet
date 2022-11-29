import { Application } from '../core/application';
import type { Command } from '../core/command';

interface Detail
{
    name: string;
    params: string;
    command: Command;
}

export function inspectUndoStack()
{
    const undoStack = Application.instance.undoStack;
    const details: Detail[] = [];

    undoStack.stack.forEach((command) =>
    {
        const detail: Detail = {
            name: command.name,
            params: JSON.stringify(command.params),
            command,
        };

        details.push(detail);
    });

    console.log(`\n%cUndo Stack [${details.length}]`, 'color:cyan');
    console.table(details);
}
