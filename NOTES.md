# Known Feature Issues or Edge Cases

* Multi-selection undo does not reset gizmo transform correctly, it resets it
    - May need to store transform gizmo state with each command in undo stack?
    - Also need a way to recalculate multi-transform gizmo when remote nodes move
* Gizmo is only setting pivot adjustments for active node, needs to update all clone descendants

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
            - support variants
        - single vs multi:
            - if all from same parent, paste into that parent
            - if from different parents, paste into selected parent
* Cloaking - needs overhaul, perhaps rename to "trash" and "untrash"
    - Undoing nested nodes restores children which were also removed, could be an uncloaking problem
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
* Transform gizmo uses statusbar items instead of message
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
* Reduce grid lines when zoomed out
* Unlink

Tech Debt:
* Rename all actions and commands with Action and Command suffixes (files too), normalise new vs create
* Refactor customProperties from ClonableNode to separate class
* Refactor Convergence datastore to be even more generic as possible to help future backend swaps
* Replace ClonableNode generics from Interfaces to Types for models, may loosen generic polymorphism
* Replace Color with colord
* Investigate Cloudflare + YJS

Rollout:
* Fix cloning and prefab create/edit
* Investigate using Convergence for alpha storage solution
* Upgrade to Svelte-kit
* Investigate prod log and replay capabilities
* Investigate Analytics