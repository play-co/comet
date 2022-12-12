import type { Container } from 'pixi.js';

import type { PrefabAsset } from '../../assets/prefabAsset';
import type { SceneAsset } from '../../assets/sceneAsset';
import type { TextureAsset } from '../../assets/textureAsset';
import { ModelSchema } from '../../model/schema';
import type { NewNodeOptions } from '../abstract/clonableNode';
import { MetaNode } from '../abstract/metaNode';
import { type ContainerModel, containerSchema } from './container';

export type ProjectModel = ContainerModel;

export const projectSchema = new ModelSchema<ProjectModel>(containerSchema.properties);

export class ProjectNode extends MetaNode<ProjectModel, Container>
{
    public assets: {
        textures: Record<string, TextureAsset>;
        scenes: Record<string, SceneAsset>;
        prefabs: Record<string, PrefabAsset>;
    };

    constructor(
        options: NewNodeOptions<ProjectModel> = {},
    )
    {
        super(options);

        this.assets = {
            textures: {},
            scenes: {},
            prefabs: {},
        };
    }

    public nodeType()
    {
        return 'Project';
    }
}

