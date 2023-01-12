import Events from '../../events';
import { Menu } from '../views/components/menu';

export const helpMenu = new Menu([
    {
        label: 'About',
        onClick: () =>
        {
            Events.dialog.modal.open.emit('splash');
        },
    },
    {
        label: 'Report a bug',
        onClick: () =>
        {
            window.open('https://github.com/play-co/comet/issues/new?assignees=&labels=&template=bug_report.md&title=', '_blank');
        },
    },
    {
        label: 'Request a feature',
        onClick: () =>
        {
            window.open('https://github.com/play-co/comet/issues/new?assignees=&labels=&template=feature_request.md&title=', '_blank');
        },
    },
]);
