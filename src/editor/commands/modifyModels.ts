import { Command } from '../core/command';
import { type ModifyModelCommandParams, ModifyModelCommand } from './modifyModel';

export interface ModifyModelsCommandParams
{
    modifications: ModifyModelCommandParams<any>[];
}

export interface ModifyModelsCommandCache
{
    commands: ModifyModelCommand<any>[];
}

export class ModifyModelsCommand
    extends Command<ModifyModelsCommandParams, void, ModifyModelsCommandCache>
{
    public static commandName = 'ModifyModels';

    public apply(): void
    {
        const { cache, params: { modifications } } = this;

        cache.commands = [];

        modifications.forEach((modification) =>
        {
            const command = new ModifyModelCommand(modification);

            cache.commands.push(command);

            command.run();
        });
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].undo();
        }
    }

    public redo(): void
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            commands[i].redo();
        }
    }
}
