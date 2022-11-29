import type { NodeSchema } from '../../core/nodes/schema';
import { Application } from '../core/application';

interface Detail
{
    type: string;
    parent: string;
    children: string;
    node: NodeSchema;
}

export function inspectDatastoreNodes()
{
    const datastore = Application.instance.datastore;
    const details: Record<string, Detail> = {};

    const project = datastore.toProjectSchema();
    let nodeCount = 0;

    for (const [nodeId, node] of Object.entries(project.nodes))
    {
        details[nodeId] = {
            type: node.type,
            parent: node.parent ? node.parent : '#none',
            children: node.children.length === 0 ? '#empty' : node.children.join(','),
            node,
        };
        nodeCount++;
    }

    console.log(`\n%cDatastore Nodes [${nodeCount}]`, 'color:cyan');
    console.table(details);
}
