const tsj = require('ts-json-schema-generator');
const fs = require('fs');
const path = require('path');

/** @type {import('ts-json-schema-generator/dist/src/Config').Config} */
const config = {
    path: './src/types/*.ts',
    tsconfig: './tsconfig.json',
    minify: true,
    type: '*',
};

const output_path = path.resolve(__dirname, '../src/schema');
const output_file = `${output_path}/index.ts`;

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString = JSON.stringify(schema, null, 2);

const warning = `/**\n WARNING! This file is auto-generated, do not edit by hand.\n Run the "rushx typegen" command to generate this file from the current contents of "./types/*.ts"\n*/`;

fs.mkdirSync(output_path, { recursive: true });

fs.writeFile(
    output_file,
    `${warning}\n\nexport default ${schemaString}`,
    (err) => {
        if (err) throw err;
    },
);

console.log(
    `✅ Successfully created ${output_file} schema from existing types.`,
);
