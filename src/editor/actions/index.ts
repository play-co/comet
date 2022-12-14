import { DeleteNodeAction } from './deleteNode';
import { DeselectAction } from './deselect';
import { InspectAction } from './inspect';
import { NewContainerAction } from './newContainer';
import { NewFolderAction } from './newFolder';
import { NewSceneAction } from './newScene';
import { NewSpriteAction } from './newSprite';
import { NudgeAction } from './nudge';
import { RedoAction } from './redo';
import { SelectAllAction } from './selectAll';
import { UndoAction } from './undo';

export const Actions = {
    newScene: new NewSceneAction(),
    newSprite: new NewSpriteAction(),
    newContainer: new NewContainerAction(),
    newFolder: new NewFolderAction(),
    undo: new UndoAction(),
    redo: new RedoAction(),
    deleteNode: new DeleteNodeAction(),
    inspect: new InspectAction(),
    deselect: new DeselectAction(),
    selectAll: new SelectAllAction(),
    nudge: new NudgeAction(),
};
