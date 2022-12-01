import { getGlobalEmitter } from '../../core/events';
import type { ModelBase } from '../../core/model/model';
import { Command } from '../core/command';
import type { DatastoreEvent } from '../events/datastoreEvents';
import { getUrlParam } from '../util';

const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();

export interface ModifyModelCommandParams<M>
{
    nodeId: string;
    values: Partial<M>;
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
        const { datastore, params, params: { values }, cache } = this;
        const sourceNode = this.getInstance(params.nodeId);
        const node = sourceNode.getModificationCloneTarget();
        const nodeId = node.id;

        // update datastore
        if (getUrlParam<number>('readonly') !== 1)
        {
            datastore.modifyNodeModel(nodeId, values);
        }

        // update graph node
        const prevValues = node.model.setValues(values) as Partial<M>;

        // update cache only if not set (otherwise its part of undo stack already)
        if (!cache.prevValues)
        {
            const values = {} as Partial<M>;

            for (const [k, v] of Object.entries(prevValues))
            {
                if (v !== undefined)
                {
                    // don't sore undefined values
                    values[k as keyof M] = v;
                }
            }

            this.cache.prevValues = values;
        }

        datastoreEmitter.emit('datastore.local.node.modified', {
            nodeId,
            values,
        });
    }

    public undo(): void
    {
        const { cache: { prevValues }, params: { nodeId } } = this;

        if (prevValues && Object.values(prevValues).length > 0)
        {
            new ModifyModelCommand({ nodeId, values: prevValues }).run();
        }
    }
}
