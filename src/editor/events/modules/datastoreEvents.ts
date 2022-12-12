import type { ClonableNode } from '../../../core';
import type { ModelValue } from '../../../core/model/model';
import type { CustomPropertyType, CustomPropertyValueType } from '../../../core/nodes/customProperties';
import type { CloneInfoSchema, TextureAssetSchema } from '../../../core/nodes/schema';
import { Emit } from '../emitter';

interface EventData
{
    nodeId: string;
}

export default {
    connection: {
        attempt: Emit<void>(),
        success: Emit<void>(),
        error: Emit<void>(),
        end: Emit<void>(),
    },
    node: {
        local: {
            hydrated: Emit<EventData>(),
            created: Emit<EventData>(),
            modified: Emit<EventData & { values: Partial<Record<string, ModelValue>> }>(),
            cloaked: Emit<ClonableNode>(),
            uncloaked: Emit<ClonableNode>(),
            textureCreated: Emit<EventData & { textureId: string }>(),
        },
        remote: {
            created: Emit<EventData>(),
            removed: Emit<EventData & { parentId?: string }>(),
            setParent: Emit<EventData & { parentId: string }>(),
            setChildren: Emit<EventData & { childIds: string[] }>(),
            customProp: {
                defined: Emit<EventData & { customKey: string; type: CustomPropertyType; value: CustomPropertyValueType }>(),
                undefined: Emit<EventData & { customKey: string }>(),
                assigned: Emit<EventData & { modelKey: string; customKey: string }>(),
                unassigned: Emit<EventData & { modelKey: string }>(),
            },
            modelModified: Emit<EventData & {
                key: string | null; // undefined means whole object was set, which will be .value
                value: ModelValue;
            }>(),
            cloneInfoModified: Emit<EventData & CloneInfoSchema>(),
        },
    },
    texture: {
        created: Emit<{id: string} & TextureAssetSchema>(),
    },
};
