import { Application } from '../core/application';
import { DevInspector } from './inspector';

export interface DatastoreNodeDetail
{
    type: string;
    parent: string;
    children: string;
}

export class DatastoreNodeInspector extends DevInspector<DatastoreNodeDetail>
{
    protected getDetails()
    {
        const datastore = Application.instance.datastore;
        const details: Record<string, DatastoreNodeDetail> = {};

        const project = datastore.toProjectSchema();

        for (const [nodeId, node] of Object.entries(project.nodes))
        {
            details[nodeId] = {
                type: node.type,
                parent: node.parent ? node.parent : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.join(','),
            };
        }

        return details;
    }

    protected inspect()
    {
        const datastore = Application.instance.datastore;

        console.log(datastore.toProjectSchema());
    }
}
