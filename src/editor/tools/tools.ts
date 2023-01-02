import { NewContainerTool } from './newContainerTool';
import { NewSpriteTool } from './newSpriteTool';
import { SelectTool } from './selectTool';

export const Tools = {
    select: new SelectTool(),
    newSprite: new NewSpriteTool(),
    newContainer: new NewContainerTool(),
};
