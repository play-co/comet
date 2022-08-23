import Ajv from 'ajv';

import schema from '../schema';

interface Schema
{
    type: string;
    properties: Record<
    string,
    {
        type?: string;
        $ref?: string;
    }
    >;
    additionalProperties: boolean;
    required?: string[];
}
export function getSchemaValidator(
    definitionKey: keyof typeof schema.definitions,
)
{
    const ajv = new Ajv();

    ajv.addSchema(schema);
    const validate = ajv.getSchema(`#/definitions/${definitionKey as string}`);

    if (!validate)
    {
        throw new Error('Validator not found');
    }

    return validate;
}

export function getProperties(definitionKey: keyof typeof schema.definitions)
{
    function _(defRef: Schema)
    {
        const def: Schema = {
            type: defRef.type,
            properties: {},
            required: [...(defRef.required ?? [])],
            additionalProperties: defRef.additionalProperties,
        };

        Object.keys(defRef.properties).forEach((k) =>
        {
            if (defRef.properties[k].$ref)
            {
                const defName = (defRef.properties[k].$ref as string).replace(
                    '#/definitions/',
                    '',
                ) as keyof typeof schema.definitions;

                def.properties[k] = _(schema.definitions[defName]);
            }
            else
            {
                def.properties[k] = defRef.properties[k];
            }
        });

        return def;
    }

    return _(schema.definitions[definitionKey] as Schema);
}

export function getVisibleProperties(
    definitionKey: keyof typeof schema.definitions,
)
{
    return Object.keys(
        (schema.definitions[definitionKey] as Schema).properties,
    ).filter((key) => key.charAt(0) === '$');
}
