/**
 WARNING! This file is auto-generated, do not edit by hand.
 Run the "rushx typegen" command to generate this file from the current contents of "./types/*.ts"
*/

export default {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
        BaseNode: {
            type: 'object',
            properties: {
                baseProp: {
                    type: 'string',
                },
                _basePrivate: {
                    type: 'string',
                },
            },
            required: [
                'baseProp',
                '_basePrivate',
            ],
            additionalProperties: false,
        },
        Sub1: {
            type: 'object',
            properties: {
                baseProp: {
                    type: 'string',
                },
                _basePrivate: {
                    type: 'string',
                },
                sub1Prop: {
                    type: 'string',
                },
            },
            required: [
                '_basePrivate',
                'baseProp',
                'sub1Prop',
            ],
            additionalProperties: false,
        },
        Sub2: {
            type: 'object',
            properties: {
                baseProp: {
                    type: 'string',
                },
                _basePrivate: {
                    type: 'string',
                },
                sub1Prop: {
                    type: 'string',
                },
                sub2Prop: {
                    type: 'string',
                },
            },
            required: [
                '_basePrivate',
                'baseProp',
                'sub1Prop',
                'sub2Prop',
            ],
            additionalProperties: false,
        },
    },
};
