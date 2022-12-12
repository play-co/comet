import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerNode } from './display/containerNode';

export class SceneNode extends ContainerNode<ContainerModel, Container>
{
    public nodeType()
    {
        return 'Scene';
    }

    public get isMetaNode(): boolean
    {
        return true;
    }
}

