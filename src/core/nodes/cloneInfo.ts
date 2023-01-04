import { getInstance } from './instances';
import type { CloneInfoSchema } from './schema';

export enum CloneMode
    {
    Original = 'original',
    Duplicate = 'duplicate',
    ReferenceRoot = 'reference_root',
    Reference = 'reference',
    VariantRoot = 'variant_root',
    Variant = 'variant',
}

export interface Clonable
{
    id: string;
    cloneInfo: CloneInfo;
}

export class CloneInfo
{
    public cloneMode: CloneMode;
    public cloner?: Clonable;
    public cloned: Clonable[];

    public static fromSchema(cloneInfo: CloneInfoSchema)
    {
        return new CloneInfo(cloneInfo.cloneMode, cloneInfo.cloner ? getInstance(cloneInfo.cloner) : undefined);
    }

    constructor(cloneMode: CloneMode = CloneMode.Original, cloner?: Clonable)
    {
        this.cloneMode = cloneMode;
        this.cloner = cloner;
        this.cloned = [];
    }

    public clone()
    {
        const cloneInfo = new CloneInfo(this.cloneMode, this.cloner);

        cloneInfo.cloned = [...this.cloned];

        return cloneInfo;
    }

    public get clonedCount()
    {
        return this.cloned.length;
    }

    public get isClone()
    {
        return this.cloner !== undefined;
    }

    public get hasCloned()
    {
        return this.cloned.length > 0;
    }

    public get isOriginal()
    {
        return this.cloneMode === CloneMode.Original;
    }

    public get isDuplicate()
    {
        return this.cloneMode === CloneMode.Duplicate;
    }

    public get isVariantInstance()
    {
        return !!(this.cloner?.cloneInfo.isVariantOrRoot);
    }

    public get isVariantRoot()
    {
        return this.cloneMode === CloneMode.VariantRoot;
    }

    public get isVariant()
    {
        return this.cloneMode === CloneMode.Variant;
    }

    public get isReferenceOrRoot()
    {
        return this.cloneMode === CloneMode.Reference || this.cloneMode === CloneMode.ReferenceRoot;
    }

    public get isVariantOrRoot()
    {
        return this.cloneMode === CloneMode.Variant || this.cloneMode === CloneMode.VariantRoot;
    }

    public get isInstanceRoot()
    {
        return this.isVariantOrRoot || this.isReferenceRoot;
    }

    public get isRoot()
    {
        return this.isReferenceRoot || this.isVariantRoot;
    }

    public get isReference()
    {
        return this.cloneMode === CloneMode.Reference;
    }

    public get isReferenceRoot()
    {
        return this.cloneMode === CloneMode.ReferenceRoot;
    }

    public getClonedAt<T>(index: number)
    {
        return this.cloned[index] as unknown as T;
    }

    public isClonedFrom(cloner: Clonable)
    {
        return this.cloner === cloner;
    }

    public unlink(owner: Clonable)
    {
        if (this.cloner)
        {
            this.cloner.cloneInfo.removeCloned(owner);
            delete this.cloner;
        }

        this.cloneMode = CloneMode.Original;

        return this;
    }

    public addCloned(cloned: Clonable)
    {
        this.cloned.push(cloned);

        return this;
    }

    public removeCloned(cloned: Clonable)
    {
        const index = this.cloned.indexOf(cloned);

        if (index > -1)
        {
            this.cloned.splice(index, 1);
        }

        return this;
    }

    public getCloner<T = unknown>()
    {
        return this.cloner as unknown as T;
    }

    public forEachCloned<T>(fn: (clone: T) => void)
    {
        this.cloned.forEach((cloned) => fn(cloned as unknown as T));
    }

    public toSchema(): CloneInfoSchema
    {
        const { cloner, cloneMode, cloned } = this;
        const clonerId = cloner ? cloner.id : undefined;
        const clonedSchema = cloned.map((node) => node.id);

        const schema = {
            cloner: clonerId,
            cloneMode,
            cloned: clonedSchema,
        };

        if (!clonerId)
        {
            delete schema.cloner;
        }

        return schema;
    }
}
