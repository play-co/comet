import type { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import type { NewNodeOptions } from '../abstract/clonableNode';
import { MetaNode } from '../abstract/metaNode';
import { type ContainerModel, containerSchema } from './container';

export type ProjectModel = ContainerModel;

export const projectSchema = new ModelSchema<ProjectModel>(containerSchema.properties);

export class ProjectNode extends MetaNode<ProjectModel, Container>
{
    constructor(
        options: NewNodeOptions<ProjectModel> = {},
    )
    {
        super(options);
    }

    public nodeType()
    {
        return 'Project';
    }
}

