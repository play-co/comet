import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';

export interface CreatePrefabVariantCommandParams
{
    nodeId: string;
}

export interface CreatePrefabVariantCommandReturn
{
    node: ClonableNode;
}

export interface CreatePrefabVariantCommandCache
{
    cloneCommand: CloneCommand;
}

export class CreatePrefabVariantCommand
    extends Command<CreatePrefabVariantCommandParams, CreatePrefabVariantCommandReturn, CreatePrefabVariantCommandCache>
{
    public static commandName = 'CreatePrefabVariant';

    public apply(): CreatePrefabVariantCommandReturn
    {
        // 1. clone source node in prefab folder, make sibling of source node
        const { cache, params: { nodeId } } = this;
        const app = getApp();
        const sourceNode = this.getInstance(nodeId);
        const newParentId = sourceNode.getParent().id;

        const cloneCommand = new CloneCommand({ cloneMode: CloneMode.VariantRoot, newParentId, nodeId });

        cache.cloneCommand = cloneCommand;

        const { clonedNode } = cloneCommand.run();

        app.selection.project.set(clonedNode);

        return { node: clonedNode };
    }

    public undo(): void
    {
        const { cache: { cloneCommand } } = this;

        cloneCommand.undo();
    }

    public redo()
    {
        const { cache: { cloneCommand } } = this;

        cloneCommand.redo();
    }
}
