import { NewContainerTool } from './newContainer';
import { NewSpriteTool } from './newSprite';
import { SelectTool } from './selectTool';

export const Tools = {
    select: new SelectTool(),
    newSprite: new NewSpriteTool(),
    newContainer: new NewContainerTool(),
};
