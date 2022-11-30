import { NumericRangeLimitConstraint } from '../../../src/core/model/constraints';
import { createModel } from '../../../src/core/model/model';
import { ModelSchema } from '../../../src/core/model/schema';

export interface TestModel
{
    x: number;
    y: number;
    visible: boolean;
    obj: {name: string};
}

export const constraint = new NumericRangeLimitConstraint(10, 20);

export const schema = new ModelSchema<TestModel>({
    x: {
        defaultValue: 1,
    },
    y: {
        defaultValue: 2,
    },
    visible: {
        defaultValue: true,
    },
    obj: {
        defaultValue: { name: 'foo' },
    },
}, {
    x: [constraint],
});

describe('Model', () =>
{
    const setup = (modelValues: Partial<TestModel>[]) =>
    {
        const models = modelValues
            .map((values) => createModel(schema, values));

        for (let i = 0; i < models.length - 1; i++)
        {
            models[i + 1].link(models[i]);
        }

        return models;
    };

    describe('Basic Access', () =>
    {
        it('should return defaults for values if no props passed', () =>
        {
            const model = createModel(schema);

            expect(model.getValue('x')).toBe(schema.properties.x);
            expect(model.getValue('y')).toBe(schema.properties.y);
            expect(model.getValue('visible')).toBe(schema.properties.visible);
            expect(model.getValue('obj')).toBe(schema.properties.obj);
        });

        it('should return given prop values for own values if props passed', () =>
        {
            const props = {
                x: 10,
                y: 20,
                visible: false,
                obj: { name: 'bar' },
            };
            const model = createModel(schema, props);

            expect(model.x).toBe(props.x);
            expect(model.y).toBe(props.y);
            expect(model.visible).toBe(props.visible);
            expect(model.obj).toBe(props.obj);
        });

        it('should apply constraints if given', () =>
        {
            const model = createModel(schema, { x: 15 });

            model.x = constraint.min - 10;
            expect(model.getValue('x')).toBe(constraint.min);

            model.x = constraint.max + 10;
            expect(model.getValue('x')).toBe(constraint.max);
        });

        it('should accept partial values with .setValues(), and fallback to defaults if not set', () =>
        {
            const model = createModel(schema);
            const props = {
                x: 10,
                y: 20,
            };

            model.setValues(props);

            expect(model.getValue('x')).toBe(props.x);
            expect(model.getValue('y')).toBe(props.y);

            expect(model.getValue('visible')).toBe(schema.properties.visible);
            expect(model.getValue('obj')).toBe(schema.properties.obj);
        });

        it('should throw if removing a model which is not a child', () =>
        {
            const modelA = createModel(schema);
            const modelB = createModel(schema);

            expect(() => modelA.removeChild(modelB)).toThrow();
        });
    });

    describe('Nesting and linking', () =>
    {
        it('should return defaults if no overwrites', () =>
        {
            const [modelA, modelB, modelC] = setup([{}, {}, {}]);

            expect(modelA.getValue('x')).toBe(schema.properties['x']);
            expect(modelB.getValue('x')).toBe(schema.properties['x']);
            expect(modelC.getValue('x')).toBe(schema.properties['x']);
        });

        it('should return earliest overwrite if no local overwrite', () =>
        {
            const [modelA, modelB, modelC] = setup([{ x: 11 }, {}, {}]);

            expect(modelA.getValue('x')).toBe(11);
            expect(modelB.getValue('x')).toBe(11);
            expect(modelC.getValue('x')).toBe(11);
        });

        it('should return previous overwrite if no local overwrite', () =>
        {
            const [modelA, modelB, modelC] = setup([{}, { x: 11 }, {}]);

            expect(modelA.getValue('x')).toBe(schema.properties['x']);
            expect(modelB.getValue('x')).toBe(11);
            expect(modelC.getValue('x')).toBe(11);
        });

        it('should return latest overwrite if current local overwrite', () =>
        {
            const [modelA, modelB, modelC] = setup([{}, {}, { x: 11 }]);

            expect(modelA.getValue('x')).toBe(schema.properties['x']);
            expect(modelB.getValue('x')).toBe(schema.properties['x']);
            expect(modelC.getValue('x')).toBe(11);
        });

        it('should return composite values of overwrites', () =>
        {
            const models = setup([{ x: 11 }, { y: 12 }, { visible: false }]);
            const modelC = models[2];

            expect(modelC.values).toStrictEqual({
                x: 11,
                y: 12,
                visible: false,
                obj: { name: 'foo' },
            });
        });

        it('should return own values and undefined for missing overwrites', () =>
        {
            const [modelA, modelB, modelC] = setup([{ x: 11 }, { y: 12 }, { visible: false }]);

            expect(modelA.ownValues).toStrictEqual({
                x: 11,
            });

            expect(modelB.ownValues).toStrictEqual({
                y: 12,
            });

            expect(modelC.ownValues).toStrictEqual({
                visible: false,
            });
        });

        it('should flatten current values', () =>
        {
            const [modelA, modelB, modelC] = setup([{ x: 11 }, { y: 12 }, { visible: false }]);

            modelC.flatten();
            modelB.flatten();
            modelA.flatten();

            expect(modelC.ownValues).toStrictEqual({
                x: 11,
                y: 12,
                visible: false,
            });

            expect(modelC.values).toStrictEqual({
                x: 11,
                y: 12,
                visible: false,
                obj: schema.properties.obj,
            });

            expect(modelB.ownValues).toStrictEqual({
                x: 11,
                y: 12,
            });

            expect(modelB.values).toStrictEqual({
                x: 11,
                y: 12,
                visible: schema.properties.visible,
                obj: schema.properties.obj,
            });

            expect(modelA.ownValues).toStrictEqual({
                x: 11,
            });

            expect(modelA.values).toStrictEqual({
                x: 11,
                y: schema.properties.y,
                visible: schema.properties.visible,
                obj: schema.properties.obj,
            });
        });

        it('should reset current values', () =>
        {
            const [model] = setup([{ x: 11, y: 12, visible: false }]);

            expect(model.values).toStrictEqual({
                x: 11,
                y: 12,
                visible: false,
                obj: schema.properties.obj,
            });

            model.reset();

            expect(model.values).toStrictEqual({
                x: schema.properties.x,
                y: schema.properties.y,
                visible: schema.properties.visible,
                obj: schema.properties.obj,
            });
        });
    });

    describe('Events', () =>
    {
        // it('should emit "modified" when value set', (done) =>
        // {
        //     const model = createModel(schema, { x: 11 });

        //     model.on('modified', (key, value, oldValue) =>
        //     {
        //         expect(key).toBe('x');
        //         expect(value).toBe(12);
        //         expect(oldValue).toBe(11);
        //         done();
        //     });

        //     model.x = 12;
        // });

        // it('should cascade "modified" event through children when value set', (done) =>
        // {
        //     const [modelA, modelB, modelC] = setup([{ }, { }, { }]);

        //     const updates: {id: string; key: any; value: any; oldValue: any}[] = [];

        //     modelA.on('modified', (key, value, oldValue) =>
        //     {
        //         updates.push({ id: 'modelA', key, value, oldValue });
        //     });

        //     modelB.on('modified', (key, value, oldValue) =>
        //     {
        //         updates.push({ id: 'modelB', key, value, oldValue });
        //     });

        //     modelC.on('modified', (key, value, oldValue) =>
        //     {
        //         updates.push({ id: 'modelC', key, value, oldValue });

        //         expect(updates).toEqual([{
        //             id: 'modelA',
        //             key: 'x',
        //             value: 12,
        //             oldValue: schema.properties.x,
        //         },
        //         {
        //             id: 'modelB',
        //             key: 'x',
        //             value: 12,
        //             oldValue: schema.properties.x,
        //         },
        //         {
        //             id: 'modelC',
        //             key: 'x',
        //             value: 12,
        //             oldValue: schema.properties.x,
        //         }]);
        //         done();
        //     });

        //     modelA.x = 12;
        // });
    });
});
