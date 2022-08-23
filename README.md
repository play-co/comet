# Comet (Official Pixi Editor)

> NOTE: This readme will be expanded soon

# Local Development

## Install Dependencies with pnpm

This repo uses [pnpm](https://pnpm.io/) to manage and install dependencies.

You'll need to install `pnpm` globally with:

```bash
curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
```

> NOTE: If you're using __nvm__ this will install against your current version, and not all versions.

Here's a quick summary of how to use `pnpm`, it's very similar to `npm`:

|npm command|pnpm equivalent|
|----|----|
|`npm install`|`pnpm install`|
|`npm i <pkg>`|`pnpm add <pkg>`|
|`npm run <cmd>`|`pnpm <pkg>`|
|`npx <pkg>`|`pnpm dlx <pkg>`|

## Git workflow

This repo uses [Commitizen](https://www.npmjs.com/package/commitizen) with [commitlint](https://www.npmjs.com/package/commitlint) to ensure [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) as well as [Husky](https://typicode.github.io/husky/#/) to manage Git hooks.

When you are ready to commit, use the convenience command `pnpm commit` to trigger Commitizen. This command triggers an empty commit message, otherwise the standard Git commit editor will appear after commitizen.

You'll then see the commitizen commit wizard appear, complete the commit info as required.