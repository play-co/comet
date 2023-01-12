import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { newId } from '../../core/nodes/instances';
import { getNodeSchema } from '../../core/nodes/schema';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import { CreateChildCommand } from './createChild';
import { CreatePrefabInstanceCommand } from './createPrefabInstance';

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
    commands: Command[];
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
            const { isReferenceRoot, isReference, isOriginal } = sourceNode.cloneInfo;

            if (isOriginal)
            {
                // original nodes are cloned

                const command = new CloneCommand({
                    cloneMode: CloneMode.Duplicate,
                    nodeId: sourceNode.id,
                    newParentId: sourceNode.getParent().id,
                });

                const { clonedNode } = command.run();

                cache.commands.push(command);
                nodes.push(clonedNode);
            }
            else if (isReferenceRoot)
            {
                // reference roots create another prefab instance
                const rootNode = sourceNode.getRootNode();
                const cloneTarget = sourceNode.getAddChildCloneTarget();
                let newParentId = rootNode.id;

                if (selection.length === 1)
                {
                    newParentId = sourceNode.getParent().id;
                }

                const command = new CreatePrefabInstanceCommand({
                    clonerId: cloneTarget.id,
                    parentId: newParentId,
                    model: {
                        ...sourceNode.model.ownValues,
                    },
                });

                const { node } = command.run();

                cache.commands.push(command);
                nodes.push(node);
            }
            else if (isReference)
            {
                // else references are recursively cloned and propagated
                let parentId: string | null = null;

                sourceNode.walk<ClonableNode>((node) =>
                {
                    const cloneTarget = sourceNode.getAddChildCloneTarget();
                    const nodeSchema = getNodeSchema(node);

                    if (parentId === null)
                    {
                        parentId = node.getParent().id;
                    }

                    nodeSchema.id = newId(node.nodeType());
                    nodeSchema.cloneInfo = {
                        cloner: undefined,
                        cloneMode: cloneTarget.getAddChildCloneMode(),
                        cloned: [],
                    };
                    nodeSchema.children = [];

                    const command = new CreateChildCommand({
                        nodeSchema,
                        parentId,
                    });

                    const { initialNode, nodes: createdNodes } = command.run();

                    parentId = initialNode.id;

                    cache.commands.push(command);
                    nodes.push(...createdNodes);
                });
            }
        });

        console.log(nodes.map((n) => n.id));

        const selectedNodes = nodes.filter((node) => app.viewport.rootNode.contains(node));

        if (selectedNodes.length > 0)
        {
            app.selection.hierarchy.set(selectedNodes);
        }

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            const command = commands[i];

            command.undo();
            command.restoreSelection('undo');
        }
    }

    public redo()
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            const command = commands[i];

            command.redo();
            command.restoreSelection('redo');
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        // clone command will restore selection
    }
}
