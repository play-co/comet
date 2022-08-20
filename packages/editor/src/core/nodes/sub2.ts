import { Sub1 } from './sub1';

export class Sub2 extends Sub1
{
    public sub2Prop: string;

    constructor()
    {
        super();

        this.sub2Prop = 'sub2Default';
    }
}
