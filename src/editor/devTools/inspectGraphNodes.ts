import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Application } from '../core/application';

export interface GraphNodeDetail
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
    const details: Record<string, GraphNodeDetail> = {};

    app.project.walk<ClonableNode>((node, options) =>
    {
        const detail: GraphNodeDetail = {
            depth: options.depth,
            index: node.index,
            parent: node.parent ? node.parent.id : '#empty#',
            children: node.children.length === 0 ? '#empty#' : node.children.map((node) => node.id).join(','),
            cloaked: node.isCloaked,
        };

        details[node.id] = detail;
    });

    return details;
}
