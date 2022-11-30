import { ModelSchema } from '../../../src/core/model/schema';

describe('Model Schema', () =>
{
    const properties = {
        x: {
            defaultValue: 1,
        },
        y: {
            defaultValue: 2,
        },
        z: {
            defaultValue: 3,
        },
    };
    const constraints = {} as any;
    const schema = new ModelSchema(properties, constraints);

    it('should create schema keys from given defaults', () =>
    {
        expect(schema.keys).toEqual(['x', 'y', 'z']);
    });

    it('should create schema with given defaults', () =>
    {
        expect(schema.properties).toEqual(properties);
    });

    it('should create schema with given constraints', () =>
    {
        expect(schema.constraints).toEqual(constraints);
    });
});
