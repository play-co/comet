import type { DisplayObjectModel } from '../../core/nodes/abstract/displayObjectNode';
import { ModifyModelsCommand } from '../commands/modifyModels';
import { Action } from '../core/action';
import { Application } from '../core/application';
import Events from '../events';

export class NudgeAction extends Action<void, void>
{
    constructor()
    {
        super('nudge', {
            hotkey: 'left,right,up,down,Shift+left,Shift+right,Shift+up,Shift+down',
        });
    }

    protected exec(_options: void, event: KeyboardEvent)
    {
        const { hierarchy: selection } = Application.instance.selection;

        if (!selection.isEmpty)
        {
            const inc = event.shiftKey ? 10 : 1;
            const command = ModifyModelsCommand.modifyNodes<DisplayObjectModel>(
                selection.items,
                'full',
                (node, values) =>
                {
                    if (event.key === 'ArrowLeft')
                    {
                        values.x = node.model.getValue<number>('x') - inc;
                    }
                    else if (event.key === 'ArrowRight')
                    {
                        values.x = node.model.getValue<number>('x') + inc;
                    }
                    else if (event.key === 'ArrowUp')
                    {
                        values.y = node.model.getValue<number>('y') - inc;
                    }
                    else if (event.key === 'ArrowDown')
                    {
                        values.y = node.model.getValue<number>('y') + inc;
                    }
                });

            Application.instance.undoStack.exec(command);
            Events.editor.nudge.emit();
        }
    }
}
