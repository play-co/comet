import { BaseNode } from './base';

export class Sub1 extends BaseNode
{
    public sub1Prop: string;

    constructor()
    {
        super();

        this.sub1Prop = 'sub1Default';
    }
}
