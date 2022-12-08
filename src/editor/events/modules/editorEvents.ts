import type { PropertyBinding } from '../../ui/views/propertiesPanel';
import { Emit } from '../emitter';

export default {
    propertyModified: Emit<PropertyBinding>(),
    nudge: Emit<void>(),
};
