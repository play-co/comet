import Color from 'color';

import { type GraphNodeDetail, inspectGraphNodes } from './inspectGraphNodes';
import { DevInspector } from './inspector';
import type { CellStyle, Column, Row } from './tableRenderer';

export class GraphNodeInspector extends DevInspector<GraphNodeDetail>
{
    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
    {
        const currentCell = this.getCell(column.id, row);
        const cloakedCell = this.getCell('cloaked', row);

        if (cloakedCell.value as boolean === true)
        {
            cellStyle.fillColor = Color(this.painter.backgroundColor).darken(0.35).hex();
            cellStyle.fontColor = '#aaa';
        }

        if (currentCell.value === '#empty#')
        {
            cellStyle.fontStyle = 'italic';
            cellStyle.fontColor = '#aaa';
            cellStyle.text = 'none';
        }
    };

    protected getDetails()
    {
        return inspectGraphNodes();
    }
}
