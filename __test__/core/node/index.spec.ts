import { Sprite } from 'pixi.js';

import type { ModelBase } from '../../../src/core/model/model';
import { ModelSchema } from '../../../src/core/model/schema';
import { ClonableNode } from '../../../src/core/nodes/abstract/clonableNode';
import { CloneMode } from '../../../src/core/nodes/cloneInfo';

export interface TestModel extends ModelBase
{
    x: number;
}

export const schema = new ModelSchema<TestModel>({
    x: {
        defaultValue: 0,
        category: 'Transform',
    },
});

const log: any[] = [];
// eslint-disable-next-line no-return-assign
const clearLog = () => log.length = 0;

class TestComponent extends ClonableNode<TestModel, Sprite>
{
    protected initView(): void
    {
        // noop
    }

    protected initModel(): void
    {
        // noop
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected addViewToParent(parent: ClonableNode<ModelBase, object, string>): void
    {
        // noop
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected removeViewFromParent(parent: ClonableNode<ModelBase, object, string>): void
    {
        // noop
    }

    public nodeType(): string
    {
        return 'Test';
    }

    public modelSchema(): ModelSchema<TestModel>
    {
        log.push('modelSchema');

        return schema;
    }

    public createView()
    {
        log.push('createView');

        return new Sprite();
    }

    public updateView(): void
    {
        log.push('updateView');
    }
}

describe('Component', () =>
{
    describe('General', () =>
    {
        it('should create id from componentType', () =>
        {
            const component = new TestComponent();

            expect(component.id).toBe('TestComponent:1');
        });

        it('should create model, view, and update view when constructed', () =>
        {
            clearLog();

            // eslint-disable-next-line no-new
            new TestComponent();

            expect(log[0]).toBe('modelSchema');
            expect(log[1]).toBe('createView');
            expect(log[2]).toBe('updateView');
        });

        it('should return typed view', () =>
        {
            const component = new TestComponent();

            const sprite = component.getView();

            expect(sprite).toBeInstanceOf(Sprite);
        });
    });

    describe('Model', () =>
    {
        it('should populate model values from given values', () =>
        {
            const component = new TestComponent({
                model: {
                    x: 5,
                },
            });

            expect(component.model.ownValues).toStrictEqual({
                x: 5,
            });
        });

        // it('should fire "modified" and updateView() when model updated', (done) =>
        // {
        //     clearLog();

        //     const component = new TestComponent();

        //     component.on('modelChanged', (key, value, oldValue) =>
        //     {
        //         expect(key).toBe('x');
        //         expect(value).toBe(10);
        //         expect(oldValue).toBe(schema.defaults.x);
        //         expect(log).toStrictEqual([
        //             'modelSchema',
        //             'createView',
        //             'updateView',
        //             'updateView',
        //         ]);
        //         done();
        //     });

        //     component.model.x = 10;
        // });

        // it('should not fire "modified" when disposed and model updated', () =>
        // {
        //     const component = new TestComponent();

        //     const spy = jest.fn();

        //     component.on('modelChanged', spy);

        //     component.dispose();
        //     component.model.x = 10;

        //     expect(spy).not.toHaveBeenCalled();
        // });
    });

    describe('Nesting', () =>
    {
        // it('should be able to set parent', (done) =>
        // {
        //     const parent = new TestComponent();
        //     const child = new TestComponent();

        //     parent.on('childAdded', (component) =>
        //     {
        //         expect(child.parent).toBe(parent);
        //         expect(parent.containsChild(child)).toBeTruthy();
        //         expect(component).toBe(child);
        //         done();
        //     });

        //     child.setParent(parent);
        // });

        // it('should be able to add child', (done) =>
        // {
        //     const parent = new TestComponent();
        //     const child = new TestComponent();

        //     parent.on('childAdded', (component) =>
        //     {
        //         expect(child.parent).toBe(parent);
        //         expect(parent.containsChild(child)).toBeTruthy();
        //         expect(component).toBe(child);
        //         done();
        //     });

        //     parent.addChild(child);
        // });

        it('should throw if removing child not in parent', () =>
        {
            const parent = new TestComponent();
            const child = new TestComponent();

            expect(() => parent.removeChild(child)).toThrow();
        });

        // it('should remove from existing parent if setting new parent', (done) =>
        // {
        //     const parent1 = new TestComponent();
        //     const parent2 = new TestComponent();
        //     const child = new TestComponent();

        //     parent1.addChild(child);
        //     parent1.on('childRemoved', (child) =>
        //     {
        //         expect(child).toBe(child);
        //         done();
        //     });

        //     parent2.addChild(child);
        // });

        it('should throw if trying to add component to self', () =>
        {
            const component = new TestComponent();

            expect(() => component.addChild(component)).toThrow();
        });
    });

    describe('Copy', () =>
    {
        const setup = (cloneMode = CloneMode.Variant) =>
        {
            const parent = new TestComponent();
            const childA = new TestComponent();
            const childB = new TestComponent();

            parent.addChild(childA);
            childA.addChild(childB);

            const copy = parent.clone(cloneMode);

            const copyChildA = copy.children[0] as TestComponent;
            const copyChildB = copyChildA.children[0] as TestComponent;

            return { parent, childA, childB, copy, copyChildA, copyChildB };
        };

        it('should reference cloner when copied', () =>
        {
            const { parent, childA, childB, copy, copyChildA, copyChildB } = setup();

            expect(copy.cloneInfo.isClonedFrom(parent)).toBeTruthy();
            expect(copyChildA.cloneInfo.isClonedFrom(childA)).toBeTruthy();
            expect(copyChildB.cloneInfo.isClonedFrom(childB)).toBeTruthy();
            expect(parent.cloneInfo.clonedCount).toBe(1);
            expect(childA.cloneInfo.clonedCount).toBe(1);
            expect(childB.cloneInfo.clonedCount).toBe(1);
            expect(parent.cloneInfo.getClonedAt(0)).toBe(copy);
            expect(childA.cloneInfo.getClonedAt(0)).toBe(copyChildA);
            expect(childB.cloneInfo.getClonedAt(0)).toBe(copyChildB);
        });

        it('should reference cloner model when copied linked', () =>
        {
            const component = new TestComponent({ model: { x: 15 } });
            const copy = component.clone();

            expect(copy.cloneInfo.isClonedFrom(component)).toBeTruthy();
            expect(copy.model.parent).toBe(component.model);
            expect(copy.model.x).toBe(15);
        });

        it('should not reference cloner model when copied unlinked', () =>
        {
            const component = new TestComponent({ model: { x: 15 } });
            const copy = component.clone(CloneMode.Original);

            expect(copy.cloneInfo.isClonedFrom(component)).toBeTruthy();
            expect(copy.model.parent).toBeUndefined();
            expect(copy.model.x).toBe(schema.properties.x.defaultValue);
        });

        it('should copy children when copied', () =>
        {
            const { copy, copyChildA, copyChildB } = setup();

            expect(copy.children).toHaveLength(1);
            expect(copy.children[0]).toBe(copyChildA);
            expect(copyChildA.children).toHaveLength(1);
            expect(copyChildA.children[0]).toBe(copyChildB);
            expect(copyChildB.children).toHaveLength(0);
            expect(copyChildA.parent).toBe(copy);
            expect(copyChildB.parent).toBe(copyChildA);
        });

        it('should link models when copied (deep)', () =>
        {
            const { parent, childA, childB, copy, copyChildA, copyChildB } = setup();

            expect(copy.model.parent).toBe(parent.model);
            expect(copyChildA.model.parent).toBe(childA.model);
            expect(copyChildB.model.parent).toBe(childB.model);
        });

        // it('should dispose children and unlink when self disposed', () =>
        // {
        //     const { parent, childA, childB, copy, copyChildA, copyChildB } = setup();

        //     const events: string[] = [];

        //     parent.on('disposed', () => events.push('parent:disposed'));
        //     parent.on('unlinked', () => events.push('parent:unlinked'));
        //     childA.on('disposed', () => events.push('childA:disposed'));
        //     childA.on('unlinked', () => events.push('childA:unlinked'));
        //     childB.on('disposed', () => events.push('childB:disposed'));
        //     childB.on('unlinked', () => events.push('childB:unlinked'));
        //     copy.on('disposed', () => events.push('copy:disposed'));
        //     copy.on('unlinked', () => events.push('copy:unlinked'));
        //     copyChildA.on('disposed', () => events.push('copyChildA:disposed'));
        //     copyChildA.on('unlinked', () => events.push('copyChildA:unlinked'));
        //     copyChildB.on('disposed', () => events.push('copyChildB:disposed'));
        //     copyChildB.on('unlinked', () => events.push('copyChildB:unlinked'));

        //     parent.dispose();

        //     expect(events).toStrictEqual([
        //         'parent:disposed',
        //         'copy:unlinked',
        //         'copyChildA:unlinked',
        //         'copyChildB:unlinked',
        //         'childA:disposed',
        //         'childB:disposed',
        //     ]);
        // });

        it('should remove from parent and dispose when self deleted', (done) =>
        {
            const { parent, childA } = setup();

            // childA.on('disposed', () =>
            // {
            //     expect(childA.parent).toBeUndefined();
            //     expect(parent.children).toHaveLength(0);
            //     done();
            // });

            childA.deleteSelf();

            expect(childA.parent).toBeUndefined();
            expect(parent.children).toHaveLength(0);
            done();
        });

        it('should receive child when cloner adds child', () =>
        {
            const { parent, copy } = setup();

            expect(copy.children).toHaveLength(1);

            const component = new TestComponent({ model: { x: 123 } });

            parent.addChild(component);

            expect(copy.children).toHaveLength(2);
            expect(copy.getChildAt<TestComponent>(1).model.getValue('x')).toBe(123);
        });

        it('should remove child when cloner removes child', () =>
        {
            const { parent, childA, copy, copyChildA } = setup();

            expect(copy.children).toHaveLength(1);
            expect(copy.getChildAt(0)).toBe(copyChildA);
            expect(copyChildA.parent).toBe(copy);

            childA.deleteSelf();

            expect(parent.children).toHaveLength(0);
            expect(copy.children).toHaveLength(0);
            expect(copyChildA.parent).toBeUndefined();
        });
    });
});
