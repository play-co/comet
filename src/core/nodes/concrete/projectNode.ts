import { ModelSchema } from '../../model/schema';
import type { ClonableNodeModel, NewNodeOptions } from '../abstract/clonableNode';
import { MetaNode } from '../abstract/metaNode';

export interface ProjectModel extends ClonableNodeModel
{
    name: string;
}

export const projectSchema = new ModelSchema<ProjectModel>({
});

export class ProjectNode extends MetaNode<ProjectModel>
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

    public modelSchema(): ModelSchema<ProjectModel>
    {
        return projectSchema as unknown as ModelSchema<ProjectModel>;
    }
}

