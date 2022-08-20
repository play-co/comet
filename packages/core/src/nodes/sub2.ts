import { Sub1 } from './sub1';

export class Sub2 extends Sub1
{
    public $sub2VisibleProp: string;

    public static nodeName = 'Sub2';

    constructor()
    {
        super();

        this.$sub2VisibleProp = 'sub2VisiblePropDefault';
    }
}
