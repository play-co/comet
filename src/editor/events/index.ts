import commandEvents from './modules/commandEvents';
import datastoreEvents from './modules/datastoreEvents';
import editorEvents from './modules/editorEvents';
import keyboardEvents from './modules/keyboardEvents';
import projectEvents from './modules/projectEvents';
import selectionEvents from './modules/selectionEvents';
import transformEvents from './modules/transformEvents';
import viewportEvents from './modules/viewportEvents';

export default {
    command: commandEvents,
    datastore: datastoreEvents,
    editor: editorEvents,
    keyboard: keyboardEvents,
    project: projectEvents,
    selection: selectionEvents,
    transform: transformEvents,
    viewport: viewportEvents,
};
