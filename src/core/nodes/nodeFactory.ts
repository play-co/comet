import { getUserName } from '../../editor/sync/user';
import { log } from '../log';
import type { ClonableNode, ClonableNodeConstructor, NewNodeOptions } from './abstract/clonableNode';
import { registerInstance } from './instances';

export const nodeClasses: Map<string, ClonableNodeConstructor> = new Map();

const userName = getUserName();

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
        throw new Error(`${userName}:Node type "${nodeType}" is unregistered. Did you register it in the nodeRegistry?`);
    }

    const node = new NodeClass(options) as ClonableNode;

    log('nodeFactory', 'createNode', node.id);

    registerInstance(node);

    node.update();

    return node as unknown as T;
}
