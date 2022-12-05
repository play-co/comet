import type { PropertyBinding } from '../ui/views/propertiesPanel';

export interface EditorEvent
{
    'editor.property.modified': PropertyBinding;
}
