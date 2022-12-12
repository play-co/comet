import { EventMap } from './emitter';
import commandEvents from './modules/commandEvents';
import datastoreEvents from './modules/datastoreEvents';
import editorEvents from './modules/editorEvents';
import keyboardEvents from './modules/keyboardEvents';
import projectEvents from './modules/projectEvents';
import projectPanelEvents from './modules/projectPanelEvents';
import selectionEvents from './modules/selectionEvents';
import transformEvents from './modules/transformEvents';
import viewportEvents from './modules/viewportEvents';

const Events = EventMap({
    command: commandEvents,
    datastore: datastoreEvents,
    editor: editorEvents,
    key: keyboardEvents,
    project: projectEvents,
    selection: selectionEvents,
    transform: transformEvents,
    viewport: viewportEvents,
    projectPanel: projectPanelEvents,
});

export default Events;
