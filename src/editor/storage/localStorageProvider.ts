import { base64ToBlob, blobToBas64 } from '../../core/util/file';
import { StorageProvider } from './storageProvider';

const storageKeyPrefix = 'comet.asset:';

export class LocalStorageProvider extends StorageProvider
{
    protected get idKey()
    {
        return this.localStorageKey('id');
    }

    protected localStorageKey(key: string)
    {
        return `${storageKeyPrefix}${key}`;
    }

    public init(): Promise<void>
    {
        return Promise.resolve();
    }

    public async upload(file: File)
    {
        const base64 = await blobToBas64(file);
        const id = this.localStorageKey(file.name);

        localStorage.setItem(this.localStorageKey(id), base64);

        return id;
    }

    public async download(storageKey: string)
    {
        const key = this.localStorageKey(storageKey);
        const base64 = localStorage.getItem(key);

        if (base64)
        {
            return base64ToBlob(base64);
        }

        throw new Error(`Could not retrieve localStorage data for id "${storageKey}"`);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public delete(storageKey: string): Promise<void>
    {
        throw new Error('Method not implemented.');
    }
}
