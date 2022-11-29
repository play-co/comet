import type { ClonableNode } from '../../core';
import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema, TextureAssetSchema } from '../../core/nodes/schema';

interface EventData
{
    nodeId: string;
}

export interface DatastoreEvent
{
    'datastore.connection.attempt': void;
    'datastore.connection.success': void;
    'datastore.connection.error': void;
    'datastore.connection.end': void;
    'datastore.node.hydrated': EventData;
    'datastore.texture.created': {id: string} & TextureAssetSchema;
    'datastore.remote.node.created': EventData;
    'datastore.remote.node.removed': EventData & { parentId?: string };
    'datastore.remote.node.parent.set': EventData & { parentId: string };
    'datastore.node.customProp.defined': EventData & { customKey: string; type: CustomPropertyType; value: CustomPropertyValueType };
    'datastore.remote.node.customProp.undefined': EventData & { customKey: string };
    'datastore.remote.node.customProp.assigned': EventData & { modelKey: string; customKey: string };
    'datastore.remote.node.customProp.unassigned': EventData & { modelKey: string };
    'datastore.remote.node.model.modified': EventData & {
        key: string | null; // undefined means whole object was set, which will be .value
        value: ModelValue;
    };
    'datastore.remote.node.cloneInfo.modified': EventData & CloneInfoSchema;
    'datastore.remote.node.setIndex': EventData & { index: number };
    'datastore.local.node.created': EventData;
    'datastore.local.node.cloaked': ClonableNode;
    'datastore.local.node.uncloaked': ClonableNode;
}
