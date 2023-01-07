import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { newId, unregisterInstance } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { AddChildCommand } from './addChild';
import type { CloneCommand } from './clone';
import { ModifyModelCommand } from './modifyModel';

export interface PasteCommandParams
{
    nodeIds: string[];
}

export interface PasteCommandReturn
{
    nodes: ClonableNode[];
}

type CommandSet = {
    clone: CloneCommand;
    addChild: AddChildCommand;
};

export interface PasteCommandCache
{
    commands: CommandSet[];
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

            // const cloneCommand = new CloneCommand({
            //     nodeId: sourceNode.id,
            //     // cloneMode: sourceNode.cloneInfo.isOriginal ? CloneMode.Duplicate : sourceNode.cloneInfo.cloneMode,
            //     cloneMode: sourceNode.cloneInfo.cloneMode,
            //     newParentId,
            // });

            // const { clonedNode } = cloneCommand.run();
            // const nodeSchema = getNodeSchema(clonedNode);
            const nodeSchema = getNodeSchema(sourceNode);

            nodeSchema.id = newId(sourceNode.nodeType());
            nodeSchema.model = {
                ...nodeSchema.model,
                name: nodeSchema.id,
            };
            nodeSchema.created = Date.now();

            // unregisterInstance(clonedNode);

            const addChildCommand = new AddChildCommand({
                nodeSchema,
                parentId: newParentId,
            });

            const { nodes: newNodes } = addChildCommand.run();

            // const commandSet: CommandSet = {
            //     clone: cloneCommand,
            //     addChild: addChildCommand,
            // };

            // cache.commands.push(commandSet);

            // const values = sourceNode.model.ownValues;

            // const modifyCommand = new ModifyModelCommand({
            //     nodeId: clonedNode.id,
            //     updateMode: 'full',
            //     values,
            // });

            // modifyCommand.run();

            // nodes.push(clonedNode);
            nodes.push(...newNodes);
        });

        app.selection.hierarchy.set(nodes);

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            // commands[i].undo();
            // commands[i].restoreSelection('undo');
        }
    }

    public redo()
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            // commands[i].redo();
            // commands[i].restoreSelection('redo');
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        // clone command will restore selection
    }
}
