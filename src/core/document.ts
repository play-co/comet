import EventEmitter from 'eventemitter3';

import type { ImageResource } from './resources/image';

type ComponentNode = {};

interface ResourceGroup
{
    images: ImageResource[];
    // fonts: FontResource[];
    // sounds: SoundResource[];
    // etc...
}

export class Document extends EventEmitter<'modified'>
{
    public resources: ResourceGroup;
    public components: Map<string, ComponentNode>;

    constructor()
    {
        super();
        this.resources = {
            images: [],
            // fonts: [],
            // sounds: [],
            // etc...
        };

        this.components = new Map();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const doc = new Document();
