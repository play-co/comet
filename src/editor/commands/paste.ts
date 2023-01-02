import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import { ModifyModelCommand } from './modifyModel';

export interface PasteCommandParams
{
    nodeIds: string[];
}

export interface PasteCommandReturn
{
    nodes: ClonableNode[];
}

export interface PasteCommandCache
{
    commands: CloneCommand[];
}

export class PasteCommand
    extends Command<PasteCommandParams, PasteCommandReturn, PasteCommandCache>
{
    public static commandName = 'Paste';

    public apply(): PasteCommandReturn
    {
        const { cache, params: { nodeIds } } = this;
        const app = getApp();
        const selection = app.selection.hierarchy;
        const sourceNodes = nodeIds.map((nodeId) => this.getInstance(nodeId));
        const nodes: ClonableNode[] = [];

        cache.commands = [];

        sourceNodes.forEach((sourceNode) =>
        {
            let newParentId = sourceNode.getMetaNode().id;

            if (selection.length === 1)
            {
                newParentId = selection.firstItem.id;
            }

            if (newParentId === sourceNode.id && sourceNode.parent)
            {
                newParentId = sourceNode.parent.id;
            }

            const command = new CloneCommand({
                nodeId: sourceNode.id,
                cloneMode: CloneMode.Duplicate,
                newParentId,
            });

            cache.commands.push(command);

            const { clonedNode } = command.run();

            const values = sourceNode.model.ownValues;

            const modifyCommand = new ModifyModelCommand({
                nodeId: clonedNode.id,
                updateMode: 'full',
                values,
            });

            modifyCommand.run();

            console.log(values);

            nodes.push(clonedNode);
        });

        app.selection.hierarchy.set(nodes);

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].undo();
            commands[i].restoreSelection('undo');
        }
    }

    public redo()
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            commands[i].redo();
            commands[i].restoreSelection('redo');
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        // clone command will restore selection
    }
}
