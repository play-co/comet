# Known Feature Issues or Edge Cases

* Multi-selection undo does not reset gizmo transform correctly, it resets it
    - May need to store transform gizmo state with each command in undo stack?
    - Also need a way to recalculate multi-transform gizmo when remote nodes move
* Empty (Container) icon needs to be selectable, but not scale with viewport
    - Also needs to select all children, not itself when clicked so transform gizmo can manipulate
* 'mousemove' event for viewport needs to be trapped globally, grabbing and panning stops when mouse leaves canvas
* Undoing nested nodes restores children which were also removed, could be an uncloaking problem

# Enhancements

* Box Selection could white border highlight nodes as they are being dragged over and out

# Known General Issues

* Not on latest Pixi
    - on 6, upgrade to 7 has breaking changes around event handling
* Git hooks disabled
* Local development only working in Chrome, possibly due to no certificate for wss://

# Major Missing Features

* User awareness
    - membership, auth
    - presence, cursors
* Project discovery, scoped per user

# WIP TODO:

High Priority
* Remaining UI components:
    - window status/message bar at bottom (remove existing viewport info for gizmo, send info to status bar)
    - menu bar using context menu component
    - modal dialog
* drop items from project tree to viewport
* project preview

Low Priority
* localStorage project state: UI Layout, Tree State, Current Scene, Current Selection could be saved to localStorage to preserve user workspace
* Project properties panel
    - name
    - created
* Grid properties panel
    - visible check
    - inc values (small, medium, large)

Try:
* Replace Interface with Type definitions for models, may loosen generic polymorphism
* Reduce grid lines when zoomed out
