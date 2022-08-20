import { BaseNode } from 'src/nodes/base';

export class Sub1 extends BaseNode
{
    public $sub1VisibleProp: string;

    public static nodeName = 'Sub1';

    constructor()
    {
        super();

        this.$sub1VisibleProp = 'sub1VisiblePropDefault';
    }
}
