import type { ModelBase } from '../../core/model/model';
import type { ClonableNode, ClonableNodeModel } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import { ModifyModelCommand } from './modifyModel';

export interface CreatePrefabInstanceCommandParams
{
    clonerId: string;
    parentId: string;
    model?: Partial<ModelBase>;
}

export interface CreatePrefabInstanceCommandReturn
{
    node: ClonableNode;
}

export interface CreatePrefabInstanceCommandCache
{
    clonedNode: ClonableNode;
    commands: {
        clone: CloneCommand;
        modifyModel: ModifyModelCommand<ClonableNodeModel>;
    };
}

export class CreatePrefabInstanceCommand
    extends Command<CreatePrefabInstanceCommandParams, CreatePrefabInstanceCommandReturn, CreatePrefabInstanceCommandCache>
{
    public static commandName = 'CreatePrefabInstance';

    public apply(): CreatePrefabInstanceCommandReturn
    {
        const { params: { parentId, clonerId, model } } = this;

        const cloneCommand = new CloneCommand({ nodeId: clonerId, newParentId: parentId, cloneMode: CloneMode.ReferenceRoot });
        const { clonedNode } = cloneCommand.run();

        const sourceNode = this.getInstance(clonerId);
        const values = sourceNode.model.ownValues;

        const modifyModelCommand = new ModifyModelCommand<ClonableNodeModel>({
            nodeId: clonedNode.id,
            updateMode: 'full',
            values: {
                name: clonedNode.id,
                ...values,
                ...model,
            },
        });

        modifyModelCommand.run();

        this.cache = {
            clonedNode,
            commands: {
                clone: cloneCommand,
                modifyModel: modifyModelCommand,
            },
        };

        getApp().selection.hierarchy.set(clonedNode);

        return { node: clonedNode };
    }

    public undo(): void
    {
        const { cache: { commands: { clone, modifyModel } } } = this;

        modifyModel.undo();
        clone.undo();
    }

    public redo()
    {
        const { cache: { commands: { clone, modifyModel } } } = this;

        clone.redo();
        modifyModel.redo();
    }
}
