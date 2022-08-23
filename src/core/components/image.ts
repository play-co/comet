import type { ImageResource } from '../resources/image';
import { DisplayObject } from './displayObject';

export class ImageComponent extends DisplayObject
{
    // instance props...

    public resource: ImageResource;

    constructor(resource: ImageResource)
    {
        super();

        this.resource = resource;
    }
}
