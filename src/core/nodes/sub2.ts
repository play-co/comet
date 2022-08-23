import { Sub1 } from './sub1';

export class Sub2 extends Sub1
{
    public $sub2VisibleProp: string;

    constructor()
    {
        super();

        this.$sub2VisibleProp = 'sub2VisiblePropDefault';
    }
}
