import type { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { version } from '../../../package.json';
import type { ModelBase } from '../model/model';
import type { ClonableNode } from './abstract/clonableNode';
import { CloneMode } from './cloneInfo';
import type { CustomProperty } from './customProperties';
import { newId } from './instances';

export type id = string;

export interface CustomPropsSchema
{
    defined: Record<string, CustomProperty>;
    assigned: Record<string, string>;
}

export interface CloneInfoSchema
{
    cloner?: id;
    cloneMode: CloneMode;
    cloned: id[];
}

export interface NodeSchema<M extends ModelBase = ModelBase>
{
    id: string;
    created: number;
    type: string;
    parent?: string;
    children: string[];
    model: Partial<M>;
    cloneInfo: CloneInfoSchema;
    customProperties: CustomPropsSchema;
}

export type AssetSchema<M> = NodeSchema<ModelBase & M>;

export type StoredAssetSchema<M> = AssetSchema<{
    storageKey: string;
    mimeType: string;
    size: number;
} & M>;

export type TextureAssetSchema = StoredAssetSchema<{
    width: number;
    height: number;
    mipmap: MIPMAP_MODES;
    multisample: MSAA_QUALITY;
    resolution: number;
    scaleMode: SCALE_MODES;
    wrapMode: WRAP_MODES;
}>;

export interface ProjectFileSchema
{
    id: string;
    version: string;
    nodes: Record<string, NodeSchema<any>>;
    root: id;
}

export interface NodeOptionsSchema<M extends ModelBase>
{
    id?: string;
    name?: string;
    model?: Partial<M>;
    cloneInfo?: CloneInfoSchema;
    parent?: string;
}

export function createNodeSchema<M extends ModelBase>(type: string, nodeOptions: NodeOptionsSchema<M> = {}): NodeSchema<M>
{
    const { id, model, cloneInfo: { cloner, cloneMode, cloned } = {}, parent } = nodeOptions;
    const nodeId = id ?? newId(type);

    const schema = {
        id: nodeId,
        created: Date.now(),
        type,
        parent,
        children: [],
        model: model ?? {} as M,
        cloneInfo: {
            cloner,
            cloneMode: cloneMode ?? CloneMode.Original,
            cloned: cloned ?? [],
        },
        customProperties: {
            defined: {},
            assigned: {},
        },
    };

    if (!schema.model.name)
    {
        schema.model.name = nodeId;
    }

    return schema;
}

export function createProjectSchema(name: string): ProjectFileSchema
{
    const project = createNodeSchema('Project', { model: { name } });

    const texturesFolder = createNodeSchema('Folder', { parent: project.id, model: { name: 'Textures', isReadOnly: true } });
    const scenesFolder = createNodeSchema('Folder', { parent: project.id, model: { name: 'Scenes', isReadOnly: true } });
    const prefabsFolder = createNodeSchema('Folder', { parent: project.id, model: { name: 'Prefabs', isReadOnly: true } });

    const scene = createNodeSchema('Scene', { parent: scenesFolder.id, model: { name: 'Scene1' } });

    project.children.push(texturesFolder.id, scenesFolder.id, prefabsFolder.id);
    scenesFolder.children.push(scene.id);

    return {
        id: name,
        version,
        nodes: {
            [project.id]: project,
            [scene.id]: scene,
            [texturesFolder.id]: texturesFolder,
            [scenesFolder.id]: scenesFolder,
            [prefabsFolder.id]: prefabsFolder,
        },
        root: project.id,
    };
}

export function getNodeSchema(node: ClonableNode, includeParent = true, includeChildren = true)
{
    const nodeSchema = createNodeSchema(node.nodeType(), {
        id: node.id,
        model: node.model.ownValues,
        cloneInfo: getCloneInfoSchema(node),
    });

    nodeSchema.created = node.created;

    // delete unused properties
    !nodeSchema.cloneInfo.cloner && delete nodeSchema.cloneInfo.cloner;
    !nodeSchema.parent && delete nodeSchema.parent;

    if (includeParent && node.parent)
    {
        nodeSchema.parent = node.parent.id;
    }

    if (includeChildren)
    {
        node.children.forEach((node) => nodeSchema.children.push(node.id));
    }

    node.defineCustomProperties.forEach((definedProp, key) =>
    {
        nodeSchema.customProperties.defined[key] = definedProp;
    });

    node.assignedCustomProperties.forEach((customKey, modelKey) =>
    {
        nodeSchema.customProperties.assigned[modelKey] = customKey;
    });

    return nodeSchema;
}

export function getCloneInfoSchema(node: ClonableNode)
{
    const { cloner, cloneMode, cloned } = node.cloneInfo;

    const schema: CloneInfoSchema = {
        cloneMode,
        cloned: cloned.map((node) => node.id),
    };

    if (cloner)
    {
        schema.cloner = cloner.id;
    }

    return schema;
}
