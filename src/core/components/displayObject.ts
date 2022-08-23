import type { EditableProp } from './base';
import { BaseComponent } from './base';

export class DisplayObject extends BaseComponent
{
    // instance props...

    // public pixiDisplayObject;

    public getEditableProperties(): EditableProp[]
    {
        return [
            ...super.getEditableProperties(),
            { label: 'x', type: 'number' },
            { label: 'y', type: 'number' },
            { label: 'rotation', type: 'number' },
            { label: 'alpha', type: 'number' },
            { label: 'tint', type: 'number' },
            { label: 'visible', type: 'boolean' },
        ];
    }
}
