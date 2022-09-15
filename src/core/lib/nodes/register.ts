import { ContainerNode } from './concrete/container';
import { EmptyNode } from './concrete/empty';
import { ProjectNode } from './concrete/project';
import { SceneNode } from './concrete/scene';
import { SpriteNode } from './concrete/sprite';
import { registerNodeType } from './factory';

registerNodeType(ContainerNode);
registerNodeType(EmptyNode);
registerNodeType(ProjectNode);
registerNodeType(SceneNode);
registerNodeType(SpriteNode);