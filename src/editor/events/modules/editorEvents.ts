import type { PropertyBinding } from '../../ui/views/propertiesPanel';
import { Emit } from '../emitter';

export default {
    resize: Emit<void>(),
    propertyModified: Emit<PropertyBinding>(),
};
