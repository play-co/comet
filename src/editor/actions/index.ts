import { DeleteNodeAction } from './deleteNode';
import { NewContainerAction } from './newContainer';
import { NewSpriteAction } from './newSprite';
import { RedoAction } from './redo';
import { UndoAction } from './undo';

export const Actions = {
    newSprite: new NewSpriteAction(),
    newContainer: new NewContainerAction(),
    undo: new UndoAction(),
    redo: new RedoAction(),
    deleteNode: new DeleteNodeAction(),
};
