import { CopyAction } from './copy';
import { CreateReferenceAction } from './createReference';
import { DeleteNodeAction } from './deleteNode';
import { DeleteTextureAction } from './deleteTexture';
import { DeselectAction } from './deselect';
import { ImportTextureAction } from './importTexture';
import { NewContainerAction } from './newContainer';
import { NewFolderAction } from './newFolder';
import { NewPrefabAction } from './newPrefab';
import { NewSceneAction } from './newScene';
import { NewSpriteAction } from './newSprite';
import { NudgeAction } from './nudge';
import { PasteAction } from './paste';
import { RedoAction } from './redo';
import { SelectAllAction } from './selectAll';
import { UndoAction } from './undo';

export const Actions = {
    importTexture: new ImportTextureAction(),
    newFolder: new NewFolderAction(),
    newScene: new NewSceneAction(),
    newContainer: new NewContainerAction(),
    newSprite: new NewSpriteAction(),
    newPrefab: new NewPrefabAction(),
    deleteNode: new DeleteNodeAction(),
    deleteTexture: new DeleteTextureAction(),
    selectAll: new SelectAllAction(),
    deselect: new DeselectAction(),
    nudge: new NudgeAction(),
    undo: new UndoAction(),
    redo: new RedoAction(),
    copy: new CopyAction(),
    paste: new PasteAction(),
    createReferencePrefab: new CreateReferenceAction(),
};
