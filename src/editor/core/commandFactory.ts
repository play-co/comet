import type { ModelBase } from '../../core/model/model';
import { type AddChildCommandParams, AddChildCommand } from '../commands/addChild';
import { type AddSelectionCommandParams, AddSelectionCommand } from '../commands/addSelection';
import { type AssignCustomPropCommandParams, AssignCustomPropCommand } from '../commands/assignCustomProp';
import { type CloneCommandParams, CloneCommand } from '../commands/clone';
import { type CreateNodeCommandParams, CreateNodeCommand } from '../commands/createNode';
import { type CreateTextureAssetCommandParams, CreateTextureAssetCommand } from '../commands/createTextureAsset';
import { type ModifyModelCommandParams, ModifyModelCommand } from '../commands/modifyModel';
import { type ModifyModelsCommandParams, ModifyModelsCommand } from '../commands/modifyModels';
import { type RemoveChildCommandParams, RemoveChildCommand } from '../commands/removeChild';
import { type RemoveCustomPropCommandParams, RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { type RemoveNodeCommandParams, RemoveNodeCommand } from '../commands/removeNode';
import { type RemoveNodesCommandParams, RemoveNodesCommand } from '../commands/removeNodes';
import { type SetCustomPropCommandParams, SetCustomPropCommand } from '../commands/setCustomProp';
import { type SetNodeIndexCommandParams, SetNodeIndexCommand } from '../commands/setNodeIndex';
import { type SetParentCommandParams, SetParentCommand } from '../commands/setParent';
import { type UnAssignCustomPropCommandParams, UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { type UnlinkCommandParams, UnlinkCommand } from '../commands/unlink';
import type { Command } from './command';

export type CommandName =
    'AssignCustomProp' |
    'Clone' |
    'AddChild' |
    'CreateNode' |
    'ModifyModel' |
    'ModifyModels' |
    'RemoveChild' |
    'RemoveCustomProp' |
    'RemoveNode' |
    'RestoreNode' |
    'SetCustomProp' |
    'SetParent' |
    'UnAssignCustomProp' |
    'Unlink' |
    'SetNodeIndex';

export const Commands
= {
    AddChild: AddChildCommand,
    AddSelection: AddSelectionCommand,
    AssignCustomProp: AssignCustomPropCommand,
    Clone: CloneCommand,
    CreateNode: CreateNodeCommand,
    CreateTextureAsset: CreateTextureAssetCommand,
    ModifyModel: ModifyModelCommand,
    ModifyModels: ModifyModelsCommand,
    RemoveChild: RemoveChildCommand,
    RemoveCustomProp: RemoveCustomPropCommand,
    RemoveNode: RemoveNodeCommand,
    RemoveNodes: RemoveNodesCommand,
    SetCustomProp: SetCustomPropCommand,
    SetParent: SetParentCommand,
    UnAssignCustomProp: UnAssignCustomPropCommand,
    Unlink: UnlinkCommand,
    SetNodeIndex: SetNodeIndexCommand,
};

export interface CommandParams
{
    AddChild: AddChildCommandParams<ModelBase>;
    AddSelection: AddSelectionCommandParams;
    AssignCustomProp: AssignCustomPropCommandParams;
    Clone: CloneCommandParams;
    CreateNode: CreateNodeCommandParams<ModelBase>;
    CreateTextureAsset: CreateTextureAssetCommandParams;
    ModifyModel: ModifyModelCommandParams<ModelBase>;
    ModifyModels: ModifyModelsCommandParams;
    RemoveChild: RemoveChildCommandParams;
    RemoveCustomProp: RemoveCustomPropCommandParams;
    RemoveNode: RemoveNodeCommandParams;
    RemoveNodes: RemoveNodesCommandParams;
    SetCustomProp: SetCustomPropCommandParams;
    SetParent: SetParentCommandParams;
    UnAssignCustomProp: UnAssignCustomPropCommandParams;
    Unlink: UnlinkCommandParams;
    SetNodeIndex: SetNodeIndexCommandParams;
}

export function createCommand<
    K extends keyof typeof Commands, P extends CommandParams[K],
>(commandJSON: any)
{
    const commandName = commandJSON.name as K;
    const params = commandJSON.params as P;

    const CommandClass = Commands[commandName] as {
        new (params: P): Command;
    };

    const command = new CommandClass(params);

    command.cache = commandJSON.cache;

    return command;
}
