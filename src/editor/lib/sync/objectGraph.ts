import  type  { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelBase } from '../../../core/lib/model/model';
import type { ClonableNode } from '../../../core/lib/nodes/abstract/clonableNode';
import { CloneInfo } from '../../../core/lib/nodes/cloneInfo';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/lib/nodes/customProperties';
import { createGraphNode, disposeGraphNode, getGraphNode, registerGraphNode } from '../../../core/lib/nodes/factory';
import type { NodeSchema } from './schema';

export type ObjectGraphEvent = 'objectGraphNodeCreated' | 'objectGraphNodeRemoved' | 'objectGraphParentSet';

export class ObjectGraph extends EventEmitter<ObjectGraphEvent>
{
    public createGraphNode<M extends ModelBase = {}>(nodeSchema: NodeSchema<M>)
    {
        const { type, id, model, cloneInfo: { cloneMode, cloner, cloned }, customProperties } = nodeSchema;

        // build clone info
        const cloneInfo = new CloneInfo(cloneMode, getGraphNode(cloner));

        cloned.forEach((id) =>
        {
            const node = getGraphNode(id);

            node && cloneInfo.cloned.push(node);
        });

        // create node
        const node = createGraphNode(type,
            { id, model, cloneInfo });

        // build custom properties
        for (const [name, props] of Object.entries(customProperties.defined))
        {
            props.forEach(({ type, value }) => node.setCustomProperty(name, type, value));
        }

        for (const [modelKey, customPropertyKey] of Object.entries(customProperties.assigned))
        {
            node.assignCustomProperty(modelKey, customPropertyKey);
        }

        // notify application
        this.emit('objectGraphNodeCreated', node);

        return node;
    }

    public onDatastoreNodeCreated = (nodeElement: RealTimeObject, node: ClonableNode) =>
    {
        if (node)
        {
            registerGraphNode(node);
        }

        const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;

        // notify application
        this.emit('objectGraphNodeCreated', node ?? this.createGraphNode(nodeSchema));
    };

    public onDatastoreNodeSetParent = (parentId: string, childId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(childId);

        if (parentNode && childNode)
        {
            parentNode.addChild(childNode);

            // notify application
            this.emit('objectGraphParentSet', childNode, parentNode);
        }
    };

    public onDataStoreCustomPropDefined = (
        id: string,
        name: string,
        type: CustomPropertyType,
        value: CustomPropertyValueType,
    ) =>
    {
        const node = getGraphNode(id);

        if (node)
        {
            node.setCustomProperty(name, type, value);
        }
    };

    public onDatastoreNodeRemoved = (nodeId: string, parentId: string) =>
    {
        const parentNode = getGraphNode(parentId);
        const childNode = getGraphNode(nodeId);

        if (parentNode && childNode)
        {
            parentNode.removeChild(childNode);

            // notify application
            this.emit('objectGraphNodeRemoved', nodeId, parentId);

            // remove from node graph map
            disposeGraphNode(childNode);
        }
        else
        {
            throw new Error(`Could not find parent "${parentId}" or child "${nodeId}" to remove child`);
        }
    };

    public onDatastoreCustomPropUndefined = (nodeId: string, propName: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.removeCustomProperty(propName);
        }
    };

    public onDatastoreCustomPropAssigned = (nodeId: string, modelKey: string, customKey: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.assignCustomProperty(modelKey, customKey);
        }
    };

    public onDatastoreCustomPropUnAssigned = (nodeId: string, modelKey: string) =>
    {
        const node = getGraphNode(nodeId);

        if (node)
        {
            node.unAssignCustomProperty(modelKey);
        }
    };

    public onDatastoreNodeCloned = (clone: ClonableNode) =>
    {
        console.log('onDatastoreNodeCloned', clone, clone.model.x);
        // const parentNode = getGraphNode(nodeSchema.parent);

        // if (parentNode)
        // {
        //     clone.disableCloneEvents();
        //     cloner.disableCloneEvents();

        //     clone.setParent(parentNode);

        //     clone.enableCloneEvents();
        //     cloner.enableCloneEvents();
        // }

        // this.emit('objectGraphParentSet', clone, parentNode);
    };
}
