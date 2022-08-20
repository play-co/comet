// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';
import type { Config } from 'ts-json-schema-generator';
import tsj from 'ts-json-schema-generator';

const basePath = './src/core';

const config: Config = {
    path: `${basePath}/nodes/*.ts`,
    tsconfig: './tsconfig.json',
    minify: true,
    type: '*',
    jsDoc: 'basic',
};

const outputPath = path.resolve(`${basePath}/schema`);
const outputFile = `${outputPath}/index.ts`;

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema, null, 4);

const warning
    = '/**\n WARNING! This file is auto-generated, do not edit by hand.\n'
    + 'Run the "rushx typegen" command to generate this file from the current contents of "./types/*.ts"\n*/';

fs.mkdirSync(outputPath, { recursive: true });

fs.writeFile(
    outputFile,
    `${warning}\n\nexport default ${schemaString}`,
    (err) =>
    {
        if (err) throw err;
    },
);

console.log(
    `✅ Successfully created ${outputFile} schema from existing types.`,
);
