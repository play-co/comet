import type { ModelBase } from '../../core/model/model';
import { type UpdateMode, Command } from '../core/command';
import Events from '../events';

export interface ModifyModelCommandParams<M>
{
    nodeId: string;
    values: Partial<M>;
    updateMode: UpdateMode;
    prevValues?: Partial<M>;
}

export interface ModifyModelCommandCache<M>
{
    prevValues?: Partial<M>;
}

export class ModifyModelCommand<M extends ModelBase>
    extends Command<ModifyModelCommandParams<M>, void, ModifyModelCommandCache<M>>
{
    public static commandName = 'ModifyModel';

    public apply(): void
    {
        const { datastore, params, params: { values, updateMode, prevValues }, cache } = this;
        const sourceNode = this.getInstance(params.nodeId);
        const node = sourceNode.getModificationCloneTarget();
        const nodeId = node.id;

        // update datastore
        if (updateMode === 'full')
        {
            datastore.modifyModel(nodeId, values);
        }

        // update graph node
        const setValuesResult = node.model.setValues(values) as Partial<M>;
        const previousValues = prevValues ?? setValuesResult;

        // update cache only if not set (otherwise its part of undo stack already)
        if (!cache.prevValues)
        {
            const values = {} as Partial<M>;

            for (const [k, v] of Object.entries(previousValues))
            {
                if (v !== undefined)
                {
                    // don't sore undefined values
                    values[k as keyof M] = v;
                }
            }

            this.cache.prevValues = values;
        }

        Events.datastore.node.local.modified.emit({ nodeId, values });
    }

    public undo(): void
    {
        const { cache: { prevValues }, params: { nodeId, updateMode } } = this;

        if (prevValues && Object.values(prevValues).length > 0)
        {
            new ModifyModelCommand({ nodeId, values: prevValues, updateMode }).run();
        }
    }
}
