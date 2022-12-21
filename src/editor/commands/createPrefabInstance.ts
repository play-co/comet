import type { ClonableNode, ClonableNodeModel } from '../../core/nodes/abstract/clonableNode';
import type { NodeSchema } from '../../core/nodes/schema';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { AddChildCommand } from './addChild';
import { ModifyModelCommand } from './modifyModel';

export interface CreatePrefabInstanceCommandParams
{
    parentId: string;
    nodeSchema: NodeSchema;
}

export interface CreatePrefabInstanceCommandReturn
{
    node: ClonableNode;
}

export interface CreatePrefabInstanceCommandCache
{
    clonedNode: ClonableNode;
    commands: {
        addChild: AddChildCommand;
        modifyModel: ModifyModelCommand<ClonableNodeModel>;
    };
}

export class CreatePrefabInstanceCommand
    extends Command<CreatePrefabInstanceCommandParams, CreatePrefabInstanceCommandReturn, CreatePrefabInstanceCommandCache>
{
    public static commandName = 'CreatePrefabInstance';

    public apply(): CreatePrefabInstanceCommandReturn
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
