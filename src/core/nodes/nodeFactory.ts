import EventEmitter from 'eventemitter3';

import { getUserLogColor, getUserName } from '../../editor/sync/user';
import type { ModelValue } from '../model/model';
import type { ClonableNode, ClonableNodeConstructor, NewNodeOptions } from './abstract/clonableNode';
import { registerInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

export type NodeFactoryEvents =
| 'created'
| 'disposed'
| 'modelModified'
| 'childAdded'
| 'childRemoved'
| 'cloaked'
| 'uncloaked';

export const nodeFactoryEmitter: EventEmitter<NodeFactoryEvents> = new EventEmitter<NodeFactoryEvents>();

const logStyle = 'color:MediumTurquoise';
const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;

export function registerNodeType(nodeClass: ClonableNodeConstructor)
{
    const nodeType = nodeClass.prototype.nodeType();

    if (nodeClasses.has(nodeType))
    {
        return;
    }

    nodeClasses.set(nodeType, nodeClass);
}

export function createNode<T>(nodeType: string, options: NewNodeOptions<{}>): T
{
    const NodeClass = nodeClasses.get(nodeType);

    if (!NodeClass)
    {
        throw new Error(`${userName}:Node type "${nodeType}" is unregistered.`);
    }

    const { id } = options;

    console.log(`%c${logId}:%cCreate Graph Node "${id}"`, userColor, logStyle);

    const node = new NodeClass(options) as ClonableNode;

    registerInstance(node);

    return node as unknown as T;
}

export function registerNewNode(node: ClonableNode)
{
    console.log(`%c${logId}:%cRegistering Graph Node "${node.id}"`, userColor, logStyle);

    const onModelModified = (key: string, value: ModelValue, oldValue: ModelValue) =>
    {
        nodeFactoryEmitter.emit('modelModified', node, key, value, oldValue);
    };

    const onChildAdded = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('childAdded', node);
    };

    const onChildRemoved = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('childRemoved', node);
    };

    const onCloaked = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('cloaked', node);
    };

    const onUncloaked = (node: ClonableNode) =>
    {
        nodeFactoryEmitter.emit('uncloaked', node);
    };

    const onDisposed = () =>
    {
        node.off('disposed', onDisposed);
        node.off('modelChanged', onModelModified);
        node.off('childAdded', onChildAdded);
        node.off('childRemoved', onChildRemoved);
        node.off('cloaked', onCloaked);
        node.off('uncloaked', onUncloaked);

        nodeFactoryEmitter.emit('disposed', node);
    };

    node.on('disposed', onDisposed);
    node.on('modelChanged', onModelModified);
    node.on('childAdded', onChildAdded);
    node.on('childRemoved', onChildRemoved);
    node.on('cloaked', onCloaked);
    node.on('uncloaked', onUncloaked);

    nodeFactoryEmitter.emit('created', node);
}
