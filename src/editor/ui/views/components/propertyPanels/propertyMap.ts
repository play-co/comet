import type { PropertyBinding } from '../../propertiesPanel';

export class PropertyMap
{
    protected properties: Map<string, PropertyBinding>;

    constructor(properties: PropertyBinding[])
    {
        this.properties = new Map();
        properties.forEach((propertyBinding) => this.properties.set(propertyBinding.key, propertyBinding));
    }

    public has(...keys: string[])
    {
        for (const key of keys)
        {
            if (!this.properties.has(key))
            {
                return false;
            }
        }

        return true;
    }

    public get(key: string)
    {
        return this.properties.get(key) as PropertyBinding;
    }
}
