import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Application } from '../core/application';

interface Detail
{
    depth: number;
    index: number;
    parent: string;
    children: string;
    cloaked: boolean;
    node: ClonableNode;
}

export function inspectGraphNodes()
{
    const app = Application.instance;
    const details: Record<string, Detail> = {};
    let nodeCount = 0;

    app.project.walk<ClonableNode>((node, options) =>
    {
        const detail: Detail = {
            depth: options.depth,
            index: node.index,
            parent: node.parent ? node.parent.id : 'none',
            children: node.children.map((node) => node.id).join(','),
            cloaked: node.isCloaked,
            node,
        };

        details[node.id] = detail;
        nodeCount++;
    });

    console.log(`\n%cGraph Nodes [${nodeCount}]`, 'color:cyan');
    console.table(details);
}
