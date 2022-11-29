import { type DatastoreNodeDetail, inspectDatastoreNodes } from './inspectDatastore';
import { DevInspector } from './inspector';
import type { Column, Row } from './tableRenderer';

export class DatastoreNodeInspector extends DevInspector<DatastoreNodeDetail>
{
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onCellStyle = (row: Row, column: Column): void =>
    {
        //
    };

    protected getDetails()
    {
        return inspectDatastoreNodes();
    }
}
