import type { ModelBase } from '../../core/model/model';
import { type CreateChildCommandParams, CreateChildCommand } from '../commands/createChild';
import { type AddSelectionCommandParams, AddSelectionCommand } from '../commands/addSelection';
import { type AssignCustomPropCommandParams, AssignCustomPropCommand } from '../commands/assignCustomProp';
import { type CloneCommandParams, CloneCommand } from '../commands/clone';
import { type CreateNodeCommandParams, CreateNodeCommand } from '../commands/createNode';
import { type CreatePrefabAssetCommandParams, CreatePrefabAssetCommand } from '../commands/createPrefabAsset';
import type { CreatePrefabInstanceCommandParams } from '../commands/createPrefabInstance';
import { type CreatePrefabVariantCommandParams, CreatePrefabVariantCommand } from '../commands/createPrefabVariant';
import { type CreateTextureAssetCommandParams, CreateTextureAssetCommand } from '../commands/createTextureAsset';
import { type ModifyModelCommandParams, ModifyModelCommand } from '../commands/modifyModel';
import { type ModifyModelsCommandParams, ModifyModelsCommand } from '../commands/modifyModels';
import { type PasteCommandParams, PasteCommand } from '../commands/paste';
import { type RemoveChildCommandParams, RemoveChildCommand } from '../commands/removeChild';
import { type RemoveCustomPropCommandParams, RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { type RemoveNodeCommandParams, RemoveNodeCommand } from '../commands/removeNode';
import { type RemoveNodesCommandParams, RemoveNodesCommand } from '../commands/removeNodes';
import { type RemovePrefabAssetCommandParams, RemovePrefabAssetCommand } from '../commands/removePrefabAsset';
import { type RemoveTextureAssetCommandParams, RemoveTextureAssetCommand } from '../commands/removeTextureAsset';
import { type SetCustomPropCommandParams, SetCustomPropCommand } from '../commands/setCustomProp';
import { type SetNodeIndexCommandParams, SetNodeIndexCommand } from '../commands/setNodeIndex';
import { type SetParentCommandParams, SetParentCommand } from '../commands/setParent';
import { type UnAssignCustomPropCommandParams, UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import { type UnlinkCommandParams, UnlinkCommand } from '../commands/unlink';
import type { Command } from './command';

export type CommandName =
    'AddChild' |
    'AddSelection' |
    'AssignCustomProp' |
    'Clone' |
    'CreateNode' |
    'CreatePrefabAsset' |
    'CreatePrefabInstance' |
    'CreatePrefabVariant' |
    'CreateTextureAsset' |
    'ModifyModel' |
    'ModifyModels' |
    'Paste' |
    'RemoveChild' |
    'RemoveCustomProp' |
    'RemoveNode' |
    'RemoveNodes' |
    'RemovePrefabAsset' |
    'RemoveTextureAsset' |
    'SetCustomProp' |
    'SetNodeIndex' |
    'SetParent' |
    'UnAssignCustomProp' |
    'Unlink';

export const Commands
= {
    AddChild: CreateChildCommand,
    AddSelection: AddSelectionCommand,
    AssignCustomProp: AssignCustomPropCommand,
    Clone: CloneCommand,
    CreateNode: CreateNodeCommand,
    CreatePrefabAsset: CreatePrefabAssetCommand,
    CreatePrefabInstance: CreatePrefabAssetCommand,
    CreatePrefabVariant: CreatePrefabVariantCommand,
    CreateTextureAsset: CreateTextureAssetCommand,
    ModifyModel: ModifyModelCommand,
    ModifyModels: ModifyModelsCommand,
    Paste: PasteCommand,
    RemoveChild: RemoveChildCommand,
    RemoveCustomProp: RemoveCustomPropCommand,
    RemoveNode: RemoveNodeCommand,
    RemoveNodes: RemoveNodesCommand,
    RemovePrefabAsset: RemovePrefabAssetCommand,
    RemoveTextureAsset: RemoveTextureAssetCommand,
    SetCustomProp: SetCustomPropCommand,
    SetNodeIndex: SetNodeIndexCommand,
    SetParent: SetParentCommand,
    UnAssignCustomProp: UnAssignCustomPropCommand,
    Unlink: UnlinkCommand,
};

export interface CommandParams
{
    AddChild: CreateChildCommandParams<ModelBase>;
    AddSelection: AddSelectionCommandParams;
    AssignCustomProp: AssignCustomPropCommandParams;
    Clone: CloneCommandParams;
    CreateNode: CreateNodeCommandParams<ModelBase>;
    CreatePrefabAsset: CreatePrefabAssetCommandParams;
    CreatePrefabInstance: CreatePrefabInstanceCommandParams;
    CreatePrefabVariant: CreatePrefabVariantCommandParams;
    CreateTextureAsset: CreateTextureAssetCommandParams;
    ModifyModel: ModifyModelCommandParams<ModelBase>;
    ModifyModels: ModifyModelsCommandParams;
    Paste: PasteCommandParams;
    RemoveChild: RemoveChildCommandParams;
    RemoveCustomProp: RemoveCustomPropCommandParams;
    RemoveNode: RemoveNodeCommandParams;
    RemoveNodes: RemoveNodesCommandParams;
    RemovePrefabAsset: RemovePrefabAssetCommandParams;
    RemoveTextureAsset: RemoveTextureAssetCommandParams;
    SetCustomProp: SetCustomPropCommandParams;
    SetNodeIndex: SetNodeIndexCommandParams;
    SetParent: SetParentCommandParams;
    UnAssignCustomProp: UnAssignCustomPropCommandParams;
    Unlink: UnlinkCommandParams;
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
