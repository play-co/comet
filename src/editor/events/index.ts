import { EventMap } from './emitter';
import commandEvents from './modules/commandEvents';
import contextMenuEvents from './modules/contextMenuEvents';
import datastoreEvents from './modules/datastoreEvents';
import dialogEvents from './modules/dialogEvents';
import editorEvents from './modules/editorEvents';
import focusEvents from './modules/focusEvents';
import hierarchySelectionEvents from './modules/hierarchySelectionEvents';
import itemDragEvents from './modules/itemDragEvents';
import keyboardEvents from './modules/keyboardEvents';
import mouseEvents from './modules/mouseEvents';
import projectEvents from './modules/projectEvents';
import projectSelectionEvents from './modules/projectSelectionEvents';
import toolEvents from './modules/toolEvents';
import transformEvents from './modules/transformEvents';
import viewportEvents from './modules/viewportEvents';

const Events = EventMap({
    command: commandEvents,
    datastore: datastoreEvents,
    editor: editorEvents,
    key: keyboardEvents,
    mouse: mouseEvents,
    project: projectEvents,
    selection: {
        hierarchy: hierarchySelectionEvents,
        project: projectSelectionEvents,
    },
    transform: transformEvents,
    viewport: viewportEvents,
    projectPanel: projectSelectionEvents,
    focus: focusEvents,
    contextMenu: contextMenuEvents,
    dialog: dialogEvents,
    itemDrag: itemDragEvents,
    tool: toolEvents,
});

export default Events;
