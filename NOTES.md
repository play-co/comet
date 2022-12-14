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

* delete assets (with undo)

Clean-up:
* Create separate dropzone for project panel and viewport
    - enhance with border highlight on dragenter
    - refactor dropevents
    - if drop on project, just add to Textures folder
    - if drop on viewport, add to viewport at local mousepoint

Try:
* Replace Interface with Type definitions for models, may loosen generic polymorphism
