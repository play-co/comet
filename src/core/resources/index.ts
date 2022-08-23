import { v4 as uuidv4 } from 'uuid';

export class Resource
{
    public id: string;

    constructor()
    {
        this.id = uuidv4();
    }
}
