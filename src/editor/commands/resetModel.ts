import type { ModelBase } from '../../core/model/model';
import { type UpdateMode, Command } from '../core/command';
import Events from '../events';

export interface ResetModelCommandParams
{
    nodeIds: string[];
    updateMode?: UpdateMode;
}

export interface ResetModelCommandCache
{
    prevValues: Map<string, ModelBase>;
}

export class ResetModelCommand
    extends Command<ResetModelCommandParams, void, ResetModelCommandCache>
{
    public static commandName = 'ResetModel';

    public apply(): void
    {
        const { datastore, params: { nodeIds, updateMode = 'full' }, cache } = this;

        cache.prevValues = new Map();

        nodeIds.forEach((sourceNodeId) =>
        {
            const sourceNode = this.getInstance(sourceNodeId);
            const targetNode = sourceNode.getCloneTarget();
            const nodeId = targetNode.id;

            // cache existing own values
            cache.prevValues.set(nodeId, targetNode.model.ownValues);

            // reset the model (clear own values, revert to inheriting parent or default values)
            targetNode.model.reset();

            // update datastore if full update mode
            if (updateMode === 'full')
            {
                datastore.resetModel(nodeId);
            }

            targetNode.updateRecursiveWithClones();

            Events.datastore.node.local.modified.emit({ nodeId, values: targetNode.model.ownValues });
        });
    }

    public undo(): void
    {
        const { datastore, cache: { prevValues }, params: { updateMode = 'full' } } = this;

        for (const [nodeId, values] of prevValues.entries())
        {
            const node = this.getInstance(nodeId);

            node.model.setValues(values);

            // update datastore if full update mode
            if (updateMode === 'full')
            {
                datastore.modifyModel(nodeId, values);
            }

            node.updateRecursiveWithClones();

            Events.datastore.node.local.modified.emit({ nodeId, values });
        }
    }
}
