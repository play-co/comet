import { EventMap } from './emitter';
import commandEvents from './modules/commandEvents';
import datastoreEvents from './modules/datastoreEvents';
import fileDropEvents from './modules/dropEvents';
import editorEvents from './modules/editorEvents';
import hierarchySelectionEvents from './modules/hierarchySelectionEvents';
import keyboardEvents from './modules/keyboardEvents';
import projectEvents from './modules/projectEvents';
import projectSelectionEvents from './modules/projectPanelEvents';
import transformEvents from './modules/transformEvents';
import viewportEvents from './modules/viewportEvents';

const Events = EventMap({
    command: commandEvents,
    datastore: datastoreEvents,
    editor: editorEvents,
    key: keyboardEvents,
    project: projectEvents,
    selection: {
        hierarchy: hierarchySelectionEvents,
        project: projectSelectionEvents,
    },
    transform: transformEvents,
    viewport: viewportEvents,
    projectPanel: projectSelectionEvents,
    file: fileDropEvents,
});

export default Events;
