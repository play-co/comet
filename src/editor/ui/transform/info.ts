import { Container, Graphics } from 'pixi.js';

import { degToRad } from '../../../core/util/geom';
import { KeyValueLabel } from '../components/keyValueLabel';
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
    public keyValueLabel1: KeyValueLabel;
    public keyValueLabel2: KeyValueLabel;

    constructor(public readonly frame: TransformGizmoFrame)
    {
        super();

        this.visible = false;

        this.rotationShape = new Graphics();
        this.keyValueLabel1 = new KeyValueLabel();
        this.keyValueLabel2 = new KeyValueLabel();

        this.addChild(this.rotationShape);
        this.addChild(this.keyValueLabel1);
        this.addChild(this.keyValueLabel2);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(dragInfo: DragInfo)
    {
        const { frame: { gizmo: { operation } },
            rotationShape, keyValueLabel1, keyValueLabel2 } = this;

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

        const p0 = { x: 10, y: window.innerHeight - (keyValueLabel1.height + keyValueLabel2.height) - 50 };

        keyValueLabel1.position.set(p0.x, p0.y);
        keyValueLabel2.position.set(p0.x, p0.y + keyValueLabel1.height);
    }

    protected drawRotation()
    {
        const { frame: { gizmo: { pivotGlobalPos, rotation, operation } },
            rotationShape, keyValueLabel1, keyValueLabel2 } = this;
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
        const absAngle = round(rotation, 2);
        const relAngle = round((rotationOp.readCache('rotation') - rotation) * -1, 2);

        keyValueLabel1.setText('abs °:', String(absAngle));
        keyValueLabel2.setText('rel °:', String(relAngle));
    }

    protected drawTranslation()
    {
        const { frame: { gizmo: { x, y, localX, localY } },
            keyValueLabel1, keyValueLabel2 } = this;

        keyValueLabel1.setText('global:', `${round(x, 1)}px x ${round(y, 1)}px`);
        keyValueLabel2.setText('local: ', `${round(localX, 1)}px x ${round(localY, 1)}px`);
    }

    protected drawTranslatePivot()
    {
        const { frame: { gizmo: { pivotX, pivotY, initialTransform: { naturalWidth, naturalHeight } } },
            keyValueLabel1, keyValueLabel2 } = this;

        keyValueLabel1.setText('x:', `${round(pivotX, 1)} (${round(pivotX / naturalWidth, 1)}%)`);
        keyValueLabel2.setText('y:', `${round(pivotY, 1)} (${round(pivotY / naturalHeight, 1)}%)`);
    }

    protected drawScale()
    {
        const { frame: { gizmo: { scaleX, scaleY, initialTransform: { naturalWidth, naturalHeight } } },
            keyValueLabel1, keyValueLabel2 } = this;

        keyValueLabel1.setText('width: ', `${round(naturalWidth * scaleX, 1)}px (${round(scaleX, 1)}%)`);
        keyValueLabel2.setText('height:', `${round(naturalHeight * scaleY, 1)}px (${round(scaleY, 1)}%)`);
    }
}
