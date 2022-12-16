import type { DisplayObjectModel } from '../../core/nodes/abstract/displayObjectNode';
import { ModifyModelsCommand } from '../commands/modifyModels';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';
import Events from '../events';
import { snapToIncrement } from '../ui/transform/util';

export class NudgeAction extends Action<void, void>
{
    constructor()
    {
        super('nudge', {
            hotkey: 'left,right,up,down,Shift+left,Shift+right,Shift+up,Shift+down',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec(_options: void, event: KeyboardEvent)
    {
        const app = getApp();
        const { hierarchy: selection } = app.selection;
        const gridSmallUnit = app.gridSettings.smallUnit;

        if (!selection.isEmpty)
        {
            const isShift = event.shiftKey;
            const inc = isShift ? gridSmallUnit : 1;
            const command = ModifyModelsCommand.modifyNodes<DisplayObjectModel>(
                selection.items,
                'full',
                (node, values) =>
                {
                    let x = node.model.getValue<number>('x');
                    let y = node.model.getValue<number>('y');

                    if (event.key === 'ArrowLeft')
                    {
                        x = x - inc;
                    }
                    else if (event.key === 'ArrowRight')
                    {
                        x = x + inc;
                    }
                    else if (event.key === 'ArrowUp')
                    {
                        y = y - inc;
                    }
                    else if (event.key === 'ArrowDown')
                    {
                        y = y + inc;
                    }

                    if (isShift)
                    {
                        x = snapToIncrement(x, gridSmallUnit);
                        y = snapToIncrement(y, gridSmallUnit);
                    }

                    values.x = x;
                    values.y = y;
                });

            Application.instance.undoStack.exec(command);
            Events.editor.nudge.emit();
        }
    }
}
