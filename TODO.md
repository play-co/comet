Do we even need a monorepo?

Can we just have a single codebase, with different entry points and build outputs?

Instead of subpackage, core would be sub folder in src, so would editor and player.

Single package version for "comet", same version for current built player and editor. Core is never published by itself.

Could still have package.json files in each sub "package" folder required to publish (such as player, possibly only player).

Editor would just be a build which is deployed, not published.
