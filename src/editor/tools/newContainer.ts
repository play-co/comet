import { Tool } from '../core/tool';
import { Icons } from '../ui/views/icons';

export class NewContainerTool extends Tool
{
    constructor()
    {
        super('newContainer', { icon: Icons.Container, tip: 'New Container' });
    }
}
