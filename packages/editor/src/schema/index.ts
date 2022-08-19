/**
 WARNING! This file is auto-generated, do not edit by hand.
 Run the "rushx typegen" command to generate this file from the current contents of "./types/*.ts"
*/

export default {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        D: {
            type: 'object',
            properties: {
                foo: {
                    type: 'string',
                    enum: [
                        'a',
                        'b',
                    ],
                },
            },
            required: [
                'foo',
            ],
            additionalProperties: false,
        },
        B: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                },
                d: {
                    $ref: '#/definitions/D',
                },
            },
            required: [
                'name',
                'd',
            ],
            additionalProperties: false,
        },
        A: {
            type: 'object',
            properties: {
                x: {
                    type: 'number',
                },
                y: {
                    type: 'number',
                },
                b: {
                    $ref: '#/definitions/B',
                },
            },
            required: [
                'x',
                'y',
                'b',
            ],
            additionalProperties: false,
        },
        C: {
            type: 'object',
            properties: {
                bar: {
                    type: 'boolean',
                },
            },
            additionalProperties: false,
        },
    },
};
