import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Application } from '../core/application';
import { createTable, renderTable } from './tableRenderer';

interface Detail
{
    depth: number;
    index: number;
    parent: string;
    children: string;
    cloaked: boolean;
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
            parent: node.parent ? node.parent.id : '#none',
            children: node.children.length === 0 ? '#empty' : node.children.map((node) => node.id).join(','),
            cloaked: node.isCloaked,
            // node,
        };

        details[node.id] = detail;
        nodeCount++;
    });

    console.log(`\n%cGraph Nodes [${nodeCount}]`, 'color:cyan');
    console.table(details);

    const table = createTable(details);

    renderTable(table);
}
