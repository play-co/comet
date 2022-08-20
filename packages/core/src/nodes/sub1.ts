import { BaseNode } from './base';

export class Sub1 extends BaseNode
{
    public $sub1VisibleProp: string;

    constructor()
    {
        super();

        this.$sub1VisibleProp = 'sub1VisiblePropDefault';
    }
}
