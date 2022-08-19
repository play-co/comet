import schema from './schema';
import type { A } from './types/A';
import { getProperties, getSchemaValidator } from './typeUtil';

const validate = getSchemaValidator('A');

const root: A = {
    x: 1,
    y: 2,
    _b: {
        name: 'abc',
        d: {
            foo: 'a',
        },
    },
};

if (validate(root))
{
    console.log('IS GOOD', root);
    console.log('RAW PROPERTIES', schema.definitions.A.properties);
    console.log('RECURSIVE PROPERTIES', getProperties('A'));
}
else
{
    console.error('BOOM!', validate.errors);
}
