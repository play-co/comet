import { DeleteNodeAction } from './deleteNode';
import { DeleteTextureAction } from './deleteTexture';
import { DeselectAction } from './deselect';
import { NewContainerAction } from './newContainer';
import { NewFolderAction } from './newFolder';
import { NewSceneAction } from './newScene';
import { NewSpriteAction } from './newSprite';
import { NudgeAction } from './nudge';
import { RedoAction } from './redo';
import { SelectAllAction } from './selectAll';
import { UndoAction } from './undo';

export const Actions = {
    newFolder: new NewFolderAction(),
    newScene: new NewSceneAction(),
    newContainer: new NewContainerAction(),
    newSprite: new NewSpriteAction(),
    deleteNode: new DeleteNodeAction(),
    deleteTexture: new DeleteTextureAction(),
    selectAll: new SelectAllAction(),
    deselect: new DeselectAction(),
    nudge: new NudgeAction(),
    undo: new UndoAction(),
    redo: new RedoAction(),
};
