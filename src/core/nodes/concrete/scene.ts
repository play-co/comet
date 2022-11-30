import type { Container } from 'pixi.js';

import { MetaNode } from '../abstract/metaNode';
import type { ContainerModel } from './container';

export class SceneNode extends MetaNode<ContainerModel, Container>
{
    public nodeType()
    {
        return 'Scene';
    }
}

