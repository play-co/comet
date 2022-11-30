import type { Container } from 'pixi.js';

import { type ContainerModel, ContainerNode } from '../concrete/container';

export abstract class MetaNode<M extends ContainerModel, V extends Container> extends ContainerNode<M, V>
{
    // @ts-ignore
    public nodeType()
    {
        throw new Error('Method not implemented.');
    }

    public get isMetaNode()
    {
        return true;
    }
}

