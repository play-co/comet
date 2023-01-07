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
* Prefab
    - QA Variants, Variant Instances
* Copy paste
    - Paste logic needs tightening:
        - need to support prefab instances (currently only duplicate)
        - single vs multi:
            - if all from same parent, paste into that parent
            - if from different parents, paste into selected parent
* Cloaking - needs overhaul, perhaps rename to "trash" and "untrash"
    - only root node should be marked, don't walk all child nodes
    - restore node currently brings back too many nodes, needs to be tightened
    - to replicate:
        - create asset under folder
        - delete asset
        - delete folder
        - undo delete folder: all children come back, should only be deleted node
* Text
* Masks
* Multi-user testing - once the above is checked, we need to validate and patch multi-user cases

Low Priority Fix/Improve/Add
* Multi-selection as last node with strongest tint
* Transform gizmo uses statusbar items instead of message
* Rename cloaked to trashed
* Project properties panel
    - name
    - created
* Grid properties panel
    - visible check
    - inc values (small, medium, large)
* Texture asset settings, global in project preview? use properties panel?
* Numeric input mouse drag for values
* overflow for project panel
* Menubar rollover set active
* Custom icons

Tech Debt:
* Refactor Convergence datastore to be even more generic as possible to help future backend swaps
* Replace ClonableNode generics from Interfaces to Types for models, may loosen generic polymorphism
* Reduce grid lines when zoomed out
* Replace Color with colord

Rollout:
* Fix cloning and prefab create/edit
* Investigate using Convergence for alpha storage solution
* Investigate prod log and replay capabilities
* Upgrade to Svelte-kit
* Investigate Analytics
* Investigate Cloudflare + YJS