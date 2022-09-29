import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance } from '../../core/nodes/instances';
import { AbstractCommand } from '../abstractCommand';

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
    extends AbstractCommand<ModifyModelCommandParams<M>, void, ModifyModelCommandCache<M>>
{
    public static commandName = 'ModifyModel';

    public exec(): void
    {
        const { datastore, params: { nodeId, values }, cache } = this;
        const node = getInstance<ClonableNode>(nodeId);

        // update datastore
        datastore.modifyNodeModel(nodeId, values);

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
    }

    public undo(): void
    {
        const { cache: { prevValues }, params: { nodeId } } = this;

        if (prevValues && Object.values(prevValues).length > 0)
        {
            new ModifyModelCommand({ nodeId, values: prevValues }).exec();
        }
    }
}
