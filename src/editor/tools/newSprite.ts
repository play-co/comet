import { Tool } from '../core/tool';
import { Icons } from '../ui/views/icons';

export class NewSpriteTool extends Tool
{
    constructor()
    {
        super('newSprite', { icon: Icons.Sprite, tip: 'New Sprite' });
    }
}
