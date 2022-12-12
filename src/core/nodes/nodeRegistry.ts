// core
import { ContainerNode } from './concrete/display/containerNode';
import { SpriteNode } from './concrete/display/spriteNode';
import { FolderNode } from './concrete/meta/folderNode';
import { ProjectNode } from './concrete/meta/projectNode';
import { SceneNode } from './concrete/meta/sceneNode';
// helper
import { registerNodeType } from './nodeFactory';

// registrations
registerNodeType(ContainerNode);
registerNodeType(ProjectNode);
registerNodeType(SceneNode);
registerNodeType(FolderNode);
registerNodeType(SpriteNode);
