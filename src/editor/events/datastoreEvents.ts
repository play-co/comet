import type { ModelValue } from '../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema, TextureAssetSchema } from '../../core/nodes/schema';

interface BaseDatastoreEvent
{
    nodeId: string;
}

export interface DatastoreEvent
{
    'datastore.connection.attempt': void;
    'datastore.connection.success': void;
    'datastore.connection.error': void;
    'datastore.connection.end': void;
    'datastore.node.hydrated': BaseDatastoreEvent;
    'datastore.texture.created': {id: string} & TextureAssetSchema;
    'datastore.remote.node.created': BaseDatastoreEvent;
    'datastore.remote.node.removed': BaseDatastoreEvent & { parentId?: string };
    'datastore.remote.node.parent.set': BaseDatastoreEvent & { parentId: string };
    'datastore.node.customProp.defined': BaseDatastoreEvent & { customKey: string; type: CustomPropertyType; value: CustomPropertyValueType };
    'datastore.remote.node.customProp.undefined': BaseDatastoreEvent & { customKey: string };
    'datastore.remote.node.customProp.assigned': BaseDatastoreEvent & { modelKey: string; customKey: string };
    'datastore.remote.node.customProp.unassigned': BaseDatastoreEvent & { modelKey: string };
    'datastore.remote.node.model.modified': BaseDatastoreEvent & {
        key: string | null; // undefined means whole object was set, which will be .value
        value: ModelValue;
    };
    'datastore.remote.node.cloneInfo.modified': BaseDatastoreEvent & CloneInfoSchema;
}
