import type { ClonableNode } from '../../core';
import type { Model, ModelBase } from '../../core/model/model';
import type { ModelSchema } from '../../core/model/schema';
import { type UpdateMode, Command } from '../core/command';
import Events from '../events';

export interface ModifyModelCommandParams<M>
{
    nodeId: string;
    values: Partial<M>;
    updateMode: UpdateMode;
    prevValues?: Partial<M>;
}

type UpdateInfo<M> = {
    key: keyof M;
    value: M[keyof M];
    prevValue?: M[keyof M];
};

export interface ModifyModelCommandCache<M>
{
    updates: Map<ClonableNode, UpdateInfo<M>[]>;
}

export class ModifyModelCommand<M extends ModelBase>
    extends Command<ModifyModelCommandParams<M>, void, ModifyModelCommandCache<M>>
{
    public static commandName = 'ModifyModel';

    public apply(): void
    {
        const { datastore, params, params: { values, updateMode, prevValues }, cache } = this;
        const sourceNode = this.getInstance(params.nodeId);
        const sourceModel = sourceNode.model as Model<M>;

        const updates = new Map<ClonableNode, UpdateInfo<M>[]>();

        Object.keys(values).forEach((key) =>
        {
            const node = sourceModel.getOwner(key);

            if (values[key] !== sourceModel.schema.properties[key].defaultValue)
            {
                if (!updates.has(node))
                {
                    updates.set(node, []);
                }
                const prevValue = prevValues ? prevValues[key] : sourceModel.ownValues[key as keyof M];

                (updates.get(node) as UpdateInfo<M>[]).push({
                    key: key as keyof M,
                    value: values[key] as M[keyof M],
                    prevValue,
                });
            }
        });

        for (const [node, properties] of updates.entries())
        {
            const values: Partial<M> = {};

            properties.forEach((info) =>
            {
                values[info.key] = info.value;
            });

            node.model.setValues(values);

            // update datastore
            if (updateMode === 'full')
            {
                datastore.modifyModel(node.id, values);
            }
        }

        cache.updates = updates;

        Events.datastore.node.local.modified.emit({ nodeId: sourceNode.id, values });
    }

    public undo(): void
    {
        const { datastore, cache: { updates }, params: { updateMode } } = this;

        for (const [node, properties] of updates.entries())
        {
            const values: Partial<M> = {};
            const schema = node.model.schema as unknown as ModelSchema<M>;

            properties.forEach((info) =>
            {
                values[info.key] = info.prevValue ?? schema.properties[info.key].defaultValue;
            });

            node.model.setValues(values);

            // update datastore
            if (updateMode === 'full')
            {
                datastore.modifyModel(node.id, values);
            }
        }
    }
}
