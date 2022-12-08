import type { ClonableNode } from '../../core';
import Events from '../events';

export class NodeSelection
{
    public readonly nodes: ClonableNode[];

    constructor()
    {
        this.nodes = [];
    }

    public set(node: ClonableNode | ClonableNode[])
    {
        if (!this.isEmpty)
        {
            this.deselect();
        }

        if (Array.isArray(node))
        {
            this.nodes.length = 0;
            this.nodes.push(...node);

            Events.selection.setMulti.emit(this.nodes);
        }
        else
        {
            this.nodes.length = 0;
            this.nodes.push(node);

            (window as any).$1 = node;

            Events.selection.setSingle.emit(node);
        }
    }

    public add(node: ClonableNode)
    {
        this.nodes.push(node);

        Events.selection.add.emit(node);
    }

    public remove(node: ClonableNode)
    {
        const index = this.nodes.indexOf(node);

        if (index === -1)
        {
            throw new Error(`Cannot remove node "${node.id}" from selection, not found`);
        }

        this.nodes.splice(index, 1);

        Events.selection.remove.emit(node);
    }

    public deselect()
    {
        if (this.isEmpty)
        {
            return;
        }

        Events.selection.deselect.emit();

        this.nodes.length = 0;
    }

    public shallowContains(node: ClonableNode)
    {
        return this.nodes.indexOf(node) > -1;
    }

    public deepContains(node: ClonableNode)
    {
        const allNodes: Map<ClonableNode, true> = new Map();

        this.nodes.forEach((selectedNode) =>
        {
            selectedNode.walk<ClonableNode>((node) =>
            {
                allNodes.set(node, true);
            });
        });

        return allNodes.has(node);
    }

    public onlyContains(node: ClonableNode)
    {
        return this.nodes.length === 1 && this.nodes[0] === node;
    }

    public forEach(fn: (node: ClonableNode, i: number) => void)
    {
        this.nodes.forEach(fn);
    }

    public get length()
    {
        return this.nodes.length;
    }

    public get isEmpty()
    {
        return this.nodes.length === 0;
    }

    public get isSingle()
    {
        return this.nodes.length === 1;
    }

    public get isMulti()
    {
        return this.nodes.length > 1;
    }

    public get firstNode(): ClonableNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[0];
    }

    public get lastNode(): ClonableNode | undefined
    {
        const { nodes } = this;

        if (nodes.length === 0)
        {
            return undefined;
        }

        return nodes[nodes.length - 1];
    }
}
