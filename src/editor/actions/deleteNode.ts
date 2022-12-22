import type { ClonableNode } from '../../core';
import { getInstance } from '../../core/nodes/instances';
import { RemoveNodesCommand } from '../commands/removeNodes';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type DeleteNodeOptions = {
    nodeId?: string;
};

export class DeleteNodeAction extends Action<DeleteNodeOptions, void>
{
    constructor()
    {
        super('deleteNode', {
            hotkey: 'backspace,delete,del',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'project', 'hierarchy');
    }

    protected exec(options: DeleteNodeOptions): void
    {
        const app = Application.instance;
        let nodeIds: string[] = [];

        if (options.nodeId)
        {
            nodeIds.push(options.nodeId);
        }
        else
        if (app.isAreaFocussed('viewport') || app.isAreaFocussed('hierarchy'))
        {
            nodeIds.push(...app.selection.hierarchy.items.map((node) => node.id));
            nodeIds = nodeIds.filter((nodeId) => !getInstance<ClonableNode>(nodeId).isMetaNode);
        }
        else if (app.isAreaFocussed('project'))
        {
            nodeIds.push(...app.selection.project.items.map((node) => node.id));
        }

        if (nodeIds.length)
        {
            app.undoStack.exec(new RemoveNodesCommand({ nodeIds }));
        }
    }
}
