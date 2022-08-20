const tsj = require('ts-json-schema-generator');
const fs = require('fs');
const path = require('path');

const basePath = './src';

/** @type {import('ts-json-schema-generator/dist/src/Config').Config} */
const config = {
    path: `${basePath}/nodes/*.ts`,
    tsconfig: './tsconfig.json',
    minify: true,
    type: '*',
    jsDoc: 'basic',
    additionalProperties: false,
    skipTypeCheck: false,
};

const outputPath = path.resolve(`${basePath}/schema`);
const outputFile = `${outputPath}/index.ts`;

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema, null, 4);

const warning =
    '/**\n WARNING! This file is auto-generated, do not edit by hand.\n' +
    'Run the "rushx typegen" command to generate this file from the current contents of "./types/*.ts"\n*/';

fs.mkdirSync(outputPath, { recursive: true });

fs.writeFile(
    outputFile,
    `${warning}\n\nexport default ${schemaString}`,
    (err) => {
        if (err) throw err;
    },
);

console.log(
    `✅ Successfully created ${outputFile} schema from existing types.`,
);
