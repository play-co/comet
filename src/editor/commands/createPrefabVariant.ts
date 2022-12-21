import type { ClonableNode, ClonableNodeModel } from '../../core/nodes/abstract/clonableNode';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { AddChildCommand } from './addChild';
import { ModifyModelCommand } from './modifyModel';

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
    clonedNode: ClonableNode;
    commands: {
        addChild: AddChildCommand;
        modifyModel: ModifyModelCommand<ClonableNodeModel>;
    };
}

export class CreatePrefabVariantCommand
    extends Command<CreatePrefabVariantCommandParams, CreatePrefabVariantCommandReturn, CreatePrefabVariantCommandCache>
{
    public static commandName = 'CreatePrefabVariant';

    public apply(): CreatePrefabVariantCommandReturn
    {
        const { cache, params: { parentId, nodeSchema } } = this;
        const app = getApp();

        const addChildCommand = new AddChildCommand({ parentId, nodeSchema });
        const modifyModelCommand = new ModifyModelCommand<ClonableNodeModel>({
            nodeId: nodeSchema.id,
            updateMode: 'full',
            values: {
                ...nodeSchema.model,
            },
        });

        cache.commands = {
            addChild: addChildCommand,
            modifyModel: modifyModelCommand,
        };

        const { nodes } = addChildCommand.run();

        modifyModelCommand.run();

        const node = nodes[0];

        app.selection.hierarchy.set(node);

        return { node };
    }

    public undo(): void
    {
        // const { cache: { commands: { setParent, clone } } } = this;

        // clone.undo();
        // setParent.undo();
    }

    public redo()
    {
        // const { cache: { commands: { setParent, clone } } } = this;

        // setParent.redo();
        // clone.redo();
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        // if (type === 'redo')
        // {
        //     const { cache: { clonedNode, sourceNode } } = this;
        //     const app = getApp();

        //     app.selection.hierarchy.set(clonedNode);
        //     app.selection.project.set(sourceNode);
        // }
        // else
        // {
        //     super.restoreSelection(type);
        // }
    }
}
