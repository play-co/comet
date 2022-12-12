// core
import { ContainerNode } from './concrete/display/containerNode';
import { ProjectNode } from './concrete/projectNode';
import { SceneNode } from './concrete/sceneNode';
import { SpriteNode } from './concrete/sprite';
// helper
import { registerNodeType } from './nodeFactory';

// registrations
registerNodeType(ContainerNode);
registerNodeType(ProjectNode);
registerNodeType(SceneNode);
registerNodeType(SpriteNode);
