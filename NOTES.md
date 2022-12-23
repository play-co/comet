# Known Feature Issues or Edge Cases

* Multi-selection undo does not reset gizmo transform correctly, it resets it
    - May need to store transform gizmo state with each command in undo stack?
    - Also need a way to recalculate multi-transform gizmo when remote nodes move
* Empty (Container) icon needs to be selectable, but not scale with viewport
    - Also needs to select all children, not itself when clicked so transform gizmo can manipulate
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
* Prefabs
    - Create PrefabInstance
        - need to give replaced instance same model values
    - Delete prefab asset - need to delete all clones and be undoable
    - Add items to clones needs investigating, didn't update properly
        - AddChildCommand needs modified version (new command?) which takes a Node instead of schema (which only does a single child) and propagates to all clone descendants
    - Paste logic needs tightening:
        - need to support prefab instances (currently only duplicate)
        - if all from same parent, paste into that parent
        - if from different parents, paste into selected parent
* Cloaking - needs overhaul, perhaps rename to "markForDeletion" and "unmarkForDeletion"
    - only root node should be marked, don't walk all child nodes
    - restore node currently brings back too many nodes, needs to be tightened
* Multi-user testing - once the above is checked, we need to validate and patch multi-user cases

Low Priority
* Project properties panel
    - name
    - created
* Grid properties panel
    - visible check
    - inc values (small, medium, large)
* Texture asset settings, global in project preview? use properties panel?
* Re-parent preserves global transform (via key modifier during drag operation)

Fix
* overflow for project panel

Try:
* Replace Interface with Type definitions for models, may loosen generic polymorphism
* Reduce grid lines when zoomed out
