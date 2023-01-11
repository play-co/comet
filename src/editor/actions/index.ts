import { CopyAction } from './copy';
import { CreatePrefabAssetAction } from './createPrefabAsset';
import { CreatePrefabInstanceAction } from './createPrefabInstance';
import { CreatePrefabVariantAction } from './createPrefabVariant';
import { DeleteNodeAction } from './deleteNode';
import { DeletePrefabAction } from './deletePrefab';
import { DeleteTextureAction } from './deleteTexture';
import { DeselectAction } from './deselect';
import { ImportTextureAction } from './importTexture';
import { NewContainerAction } from './newContainer';
import { NewFolderAction } from './newFolder';
import { NewSceneAction } from './newScene';
import { NewSpriteAction } from './newSprite';
import { NudgeAction } from './nudge';
import { PasteAction } from './paste';
import { RedoAction } from './redo';
import { ResetModelAction } from './resetModel';
import { SelectAllAction } from './selectAll';
import { UndoAction } from './undo';
import { UnlinkAction } from './unlink';

export const Actions = {
    importTexture: new ImportTextureAction(),
    newFolder: new NewFolderAction(),
    newScene: new NewSceneAction(),
    newContainer: new NewContainerAction(),
    newSprite: new NewSpriteAction(),
    createPrefabAsset: new CreatePrefabAssetAction(),
    createPrefabInstance: new CreatePrefabInstanceAction(),
    createPrefabVariant: new CreatePrefabVariantAction(),
    deleteNode: new DeleteNodeAction(),
    deleteTexture: new DeleteTextureAction(),
    deletePrefab: new DeletePrefabAction(),
    selectAll: new SelectAllAction(),
    deselect: new DeselectAction(),
    nudge: new NudgeAction(),
    undo: new UndoAction(),
    redo: new RedoAction(),
    copy: new CopyAction(),
    paste: new PasteAction(),
    resetModel: new ResetModelAction(),
    unlink: new UnlinkAction(),
};
