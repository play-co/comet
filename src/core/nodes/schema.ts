import type { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { version } from '../../../package.json';
import { getUserName } from '../../editor/sync/user';
import type { ModelBase } from '../model/model';
import type { ClonableNode } from './abstract/clonableNode';
import { CloneMode } from './cloneInfo';
import type { CustomProperty } from './customProperties';
import { newId } from './instances';

export type id = string;

export interface AssetSchema
{
    id: string;
    name: string;
}

export interface StoredAssetSchema<T = {}> extends AssetSchema
{
    storageKey: string;
    name: string;
    mimeType: string;
    size: number;
    properties: T;
}

export type TextureAssetSchema = StoredAssetSchema<{
    width: number;
    height: number;
    mipmap: MIPMAP_MODES;
    multisample: MSAA_QUALITY;
    resolution: number;
    scaleMode: SCALE_MODES;
    wrapMode: WRAP_MODES;
}>;

export interface NodeAssetSchema extends AssetSchema
{
    nodeId: string;
}

export type SceneAssetSchema = NodeAssetSchema;
export type PrefabAssetSchema = NodeAssetSchema;

export interface ProjectAssetsSchema
{
    textures: Record<string, TextureAssetSchema>;
    scenes: Record<string, SceneAssetSchema>;
    prefabs: Record<string, PrefabAssetSchema>;
}

export type ProjectNodesSchema = Record<string, NodeSchema<any>>;

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

export interface NodeSchema<M extends ModelBase = {}>
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

export interface ProjectSchema
{
    name: string;
    version: string;
    createdBy: string;
    root: id;
    nodes: ProjectNodesSchema;
    assets: ProjectAssetsSchema;
}

export interface NodeOptionsSchema<M extends ModelBase>
{
    id?: string;
    model?: Partial<M>;
    cloneInfo?: CloneInfoSchema;
    parent?: string;
}

export function createProjectSchema(name: string): ProjectSchema
{
    const project = createNodeSchema('Project');
    const scene = createNodeSchema('Scene', { parent: project.id });

    project.children.push(scene.id);

    return {
        name,
        version,
        createdBy: getUserName(),
        nodes: {
            [project.id]: project,
            [scene.id]: scene,
        },
        root: project.id,
        assets: {
            textures: {},
            scenes: {},
            prefabs: {},
        },
    };
}

export function createNodeSchema<M extends ModelBase>(type: string, nodeOptions: NodeOptionsSchema<M> = {}): NodeSchema<M>
{
    const { id, model, cloneInfo: { cloner, cloneMode, cloned } = {}, parent } = nodeOptions;

    return {
        id: id ?? newId(type),
        created: Date.now(),
        type,
        parent,
        children: [],
        model: model ?? {},
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
