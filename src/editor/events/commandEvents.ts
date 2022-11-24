import type { Command } from '../core/command';

export interface CommandEvent
{
    'command.exec': Command;
    'command.undo': Command;
    'command.redo': Command;
}
