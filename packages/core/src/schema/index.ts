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
                $baseVisibleProp: {
                    type: 'string',
                },
                baseProp: {
                    type: 'string',
                },
            },
            required: [
                '$baseVisibleProp',
                'baseProp',
            ],
            additionalProperties: false,
        },
        Sub1: {
            type: 'object',
            properties: {
                $baseVisibleProp: {
                    type: 'string',
                },
                baseProp: {
                    type: 'string',
                },
                $sub1VisibleProp: {
                    type: 'string',
                },
            },
            required: [
                '$baseVisibleProp',
                '$sub1VisibleProp',
                'baseProp',
            ],
            additionalProperties: false,
        },
        Sub2: {
            type: 'object',
            properties: {
                $baseVisibleProp: {
                    type: 'string',
                },
                baseProp: {
                    type: 'string',
                },
                $sub1VisibleProp: {
                    type: 'string',
                },
                $sub2VisibleProp: {
                    type: 'string',
                },
            },
            required: [
                '$baseVisibleProp',
                '$sub1VisibleProp',
                '$sub2VisibleProp',
                'baseProp',
            ],
            additionalProperties: false,
        },
    },
};
