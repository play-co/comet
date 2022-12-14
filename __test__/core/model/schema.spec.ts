import { type PropertyDescriptors, ModelSchema } from '../../../src/core/model/schema';

describe('Model Schema', () =>
{
    const properties: PropertyDescriptors<any> = {
        x: {
            defaultValue: 1,
            category: 'display',
        },
        y: {
            defaultValue: 2,
            category: 'display',
        },
        z: {
            defaultValue: 3,
            category: 'display',
        },
    };
    const schema = new ModelSchema(properties);

    it('should create schema keys from given defaults', () =>
    {
        expect(schema.keys).toEqual(['x', 'y', 'z']);
    });

    it('should create schema with given defaults', () =>
    {
        expect(schema.properties).toEqual(properties);
    });
});
