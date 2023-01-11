import type { ClonableNode } from './abstract/clonableNode';

export function getAllCloned(node: ClonableNode, array: ClonableNode[] = []): ClonableNode[]
{
    node.cloneInfo.forEachCloned<ClonableNode>((cloned) =>
    {
        array.push(cloned);
        getAllCloned(cloned, array);
    });

    return array;
}

export function getDependants(node: ClonableNode, includeSelf = false, array: ClonableNode[] = []): ClonableNode[]
{
    const { cloneInfo } = node;

    if (includeSelf && array.indexOf(node) === -1)
    {
        array.push(node);
    }

    cloneInfo.forEachCloned<ClonableNode>((cloned) => getDependants(cloned, true, array));

    node.forEach<ClonableNode>((child) => getDependants(child, true, array));

    return array;
}

export function getDependencies(node: ClonableNode, includeSelf = false, array: ClonableNode[] = []): ClonableNode[]
{
    const { cloneInfo } = node;

    if (includeSelf && array.indexOf(node) === -1)
    {
        array.push(node);
    }

    const cloner = cloneInfo.getCloner<ClonableNode>();

    if (cloner)
    {
        getDependencies(cloner, true, array);
    }

    node.getParents<ClonableNode>().forEach((parent) => getDependencies(parent, true, array));

    return array;
}

export function getRestoreDependencies(cloneRoot: ClonableNode, array: ClonableNode[] = []): ClonableNode[]
{
    const { cloneInfo } = cloneRoot;

    array.push(cloneRoot, ...cloneRoot.getAllChildren<ClonableNode>());

    const cloner = cloneInfo.getCloner<ClonableNode>();

    if (cloner)
    {
        getRestoreDependencies(cloner.getRootNode(), array);
    }

    return array;
}

