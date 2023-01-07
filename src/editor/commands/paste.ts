import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { newId } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { AddChildCommand } from './addChild';
import { CreatePrefabInstanceCommand } from './createPrefabInstance';

export interface PasteCommandParams
{
    nodeIds: string[];
}

export interface PasteCommandReturn
{
    nodes: ClonableNode[];
}

type CommandSet = {
    createPrefab?: CreatePrefabInstanceCommand;
    addChild?: AddChildCommand;
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
            const { isReferenceRoot } = sourceNode.cloneInfo;
            const cloneTarget = sourceNode.getCloneTarget();

            if (isReferenceRoot)
            {
                const rootNode = sourceNode.getRootNode();
                let newParentId = rootNode.id;

                if (selection.length === 1)
                {
                    newParentId = sourceNode.getParent().id;
                }

                const createPrefabCommand = new CreatePrefabInstanceCommand({
                    clonerId: cloneTarget.id,
                    parentId: newParentId,
                    model: {
                        ...sourceNode.model.ownValues,
                    },
                });

                const { node } = createPrefabCommand.run();

                cache.commands.push({ createPrefab: createPrefabCommand });

                nodes.push(node);
            }
            else
            {
                const rootNode = cloneTarget.getRootNode();
                let newParentId = rootNode.id;

                if (selection.length === 1)
                {
                    newParentId = cloneTarget.getParent().id;
                }

                const nodeSchema = getNodeSchema(cloneTarget);

                nodeSchema.cloneInfo.cloned = [];
                nodeSchema.id = newId(sourceNode.nodeType());
                nodeSchema.created = Date.now();

                const addChildCommand = new AddChildCommand({
                    nodeSchema,
                    parentId: newParentId,
                });

                const { nodes: newNodes } = addChildCommand.run();

                cache.commands.push({ addChild: addChildCommand });

                nodes.push(...newNodes);
            }
        });

        app.selection.hierarchy.set(nodes.filter((node) => app.viewport.rootNode.contains(node)));

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            const { addChild, createPrefab } = commands[i];

            if (createPrefab)
            {
                createPrefab.undo();
                createPrefab.restoreSelection('undo');
            }

            if (addChild)
            {
                addChild.undo();
                addChild.restoreSelection('undo');
            }
        }
    }

    public redo()
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            const { addChild, createPrefab } = commands[i];

            if (createPrefab)
            {
                createPrefab.redo();
                createPrefab.restoreSelection('redo');
            }

            if (addChild)
            {
                addChild.redo();
                addChild.restoreSelection('redo');
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        // clone command will restore selection
    }
}
