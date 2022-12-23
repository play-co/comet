import { Tool } from '../core/tool';
import { Icons } from '../ui/views/icons';

export class SelectTool extends Tool
{
    constructor()
    {
        super('select', { icon: Icons.Select, tip: 'Select' });
    }
}
