# Comet

todo....more high level description

# Local Development

## Setup

Install dependencies using rushjs.

```
rush install
```

## Building & Running Editor while working on Core

-   Open two terminals
-   In the first build core in watch mode with `rush core`
-   In the second terminal build the editor in watch mode with `rush editor`
-   Open `localhost:3000` - changes in `core` will rebuild and refresh the editor

## Schema Generation

When adding new node types to the `packages/core/src/nodes` folder you must update the schema file in `packages/core/src/schema` folder. This is done via a script, please don't edit the file manually.

```
rush schema
```

-   If you need to delete the schema file for some reason to regenerate, just create a dummy file for `packages/core/src/schema/index.ts` with `export default {} as any` as content so any other referencing files won't break compilation. The file will be overridden.
-   In VSCode you may need to restart the TypeScript language server if you extend existing types, or intellisense and type checking may break. `Command+Shift+P` then select `TypeScript: Restart Typescript server` _(make sure you are focussed on a TypeScript file or the command won't be visible)_

# References

-   [release-please](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/getting-started.md#getting-started)
