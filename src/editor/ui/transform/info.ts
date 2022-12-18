import { Container, Graphics } from 'pixi.js';

import { degToRad } from '../../../core/util/geom';
import { getApp } from '../../core/application';
import type { TransformGizmoFrame } from './frame';
import type { DragInfo } from './operation';
import { RotateOperation } from './operations/rotate';
import { ScaleOperation } from './operations/scale';
import { TranslateOperation } from './operations/translate';
import { TranslatePivotOperation } from './operations/translatePivot';
import { round } from './util';

const rotationRadius = 30;

export class TransformGizmoInfo extends Container
{
    public rotationShape: Graphics;

    constructor(public readonly frame: TransformGizmoFrame)
    {
        super();

        this.visible = false;

        this.rotationShape = new Graphics();

        this.addChild(this.rotationShape);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(dragInfo: DragInfo)
    {
        const { frame: { gizmo: { operation } },
            rotationShape } = this;

        rotationShape.clear();

        if (operation instanceof RotateOperation)
        {
            this.drawRotation();
        }
        else if (operation instanceof TranslateOperation)
        {
            this.drawTranslation();
        }
        else if (operation instanceof TranslatePivotOperation)
        {
            this.drawTranslatePivot();
        }
        else if (operation instanceof ScaleOperation)
        {
            this.drawScale();
        }
    }

    protected drawRotation()
    {
        const { frame: { gizmo: { pivotGlobalPos, rotation, operation } }, rotationShape } = this;
        const p0 = pivotGlobalPos;
        const p1 = { x: p0.x + rotationRadius, y: p0.y };
        const color = 0x66ff66;

        rotationShape.lineStyle(1, color, 1);
        rotationShape.beginFill(color, 0.2);
        rotationShape.moveTo(p0.x, p0.y);
        rotationShape.lineTo(p1.x, p1.y);
        rotationShape.arc(p0.x, p0.y, rotationRadius, 0, degToRad(rotation));
        rotationShape.lineTo(p0.x, p0.y);
        rotationShape.endFill();

        const rotationOp = operation as RotateOperation;
        const absAngle = `${rotation.toFixed(2)}°`.padEnd(8, ' ');
        const relAngle = round((rotationOp.readCache('rotation') - rotation) * -1, 2);

        getApp().statusBar.setMessage(`ROTATION ${absAngle} (relative: ${relAngle}°)`);
    }

    protected drawTranslation()
    {
        const { frame: { gizmo: { x, y, localX, localY } } } = this;

        const gx = `${round(x, 1).toFixed(2)}px`;
        const gy = `${round(y, 1).toFixed(2)}px`;
        const lx = `${round(localX, 1).toFixed(2)}px`;
        const ly = `${round(localY, 1).toFixed(2)}px`;
        const globalInfo = `GLOBAL  x: ${gx.padEnd(10, ' ')} y: ${gy.padEnd(10, ' ')}`;
        const localInfo = `LOCAL x: ${lx} y: ${ly}`;

        getApp().statusBar.setMessage(`${globalInfo} ${localInfo}`);
    }

    protected drawTranslatePivot()
    {
        const { frame: { gizmo: { pivotX, pivotY, initialTransform: { naturalWidth, naturalHeight } } } } = this;

        const xPos = `${round(pivotX, 1).toFixed(1)}px`;
        const yPos = `${round(pivotY, 1).toFixed(1)}px`;
        const relX = `${round(pivotX / naturalWidth, 1)}%`;
        const relY = `${round(pivotY / naturalHeight, 1)}%`;
        const xInfo = `${xPos.padEnd(8, ' ')} ${yPos.padEnd(8, ' ')}`;
        const yInfo = `${relX.padEnd(4, ' ')} ${relY.padEnd(4, ' ')}`;

        getApp().statusBar.setMessage(`PIVOT ${xInfo} (relative: ${yInfo})`);
    }

    protected drawScale()
    {
        const { frame: { gizmo: { scaleX, scaleY, initialTransform: { naturalWidth, naturalHeight } } } } = this;

        const wInfo = `${round(naturalWidth * scaleX, 1)}px`;
        const hInfo = `${round(naturalHeight * scaleY, 1)}px`;
        const wRel = `${round(scaleX, 1)}%`;
        const hRel = `${round(scaleY, 1)}%`;

        getApp().statusBar
            .setMessage(`SCALE ${wInfo.padEnd(10, ' ')} ${hInfo.padEnd(10, ' ')} (relative: ${wRel.padEnd(5, ' ')} ${hRel.padEnd(5, ' ')})`);
    }
}
