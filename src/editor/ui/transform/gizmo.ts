import type { SmoothGraphics } from '@pixi/graphics-smooth';
import type { InteractionEvent } from 'pixi.js';
import { Container, Graphics, Matrix, Transform } from 'pixi.js';

import { getGlobalEmitter } from '../../../core/events';
import type { DisplayObjectModel, DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import type { ModifyModelCommandParams } from '../../commands/modifyModel';
import { ModifyModelsCommand } from '../../commands/modifyModels';
import { Application } from '../../core/application';
import type { CommandEvent } from '../../events/commandEvents';
import type { DatastoreEvent } from '../../events/datastoreEvents';
import type { SelectionEvent } from '../../events/selectionEvents';
import type { TransformEvent } from '../../events/transformEvents';
import { isKeyPressed } from '../components/keyboardListener';
import type { EditableViewport } from '../components/viewport';
import { TransformGizmoFrame } from './frame';
import type { HandleVertex } from './handle';
import { type DragInfo, type TransformOperation, defaultDragInfo } from './operation';
import { RotateOperation } from './operations/rotate';
import { ScaleByEdgeOperation } from './operations/scaleByEdge';
import { ScaleByPivotOperation } from './operations/scaleByPivot';
import { TranslateOperation } from './operations/translate';
import { TranslatePivotOperation } from './operations/translatePivot';
import type { TransformGizmoConfig } from './types';
import { defaultTransformGizmoConfig } from './types';
import type { InitialGizmoTransform } from './util';
import {
    bluePivot,
    decomposeTransform,
    defaultInitialGizmoTransform,
    getGizmoInitialTransformFromView,
    getTotalGlobalBounds,
    yellowPivot,
} from './util';

export const dblClickMsThreshold = 250;

const globalEmitter = getGlobalEmitter<DatastoreEvent & CommandEvent & SelectionEvent & TransformEvent>();

type MatrixCache = {
    local: Matrix;
    world: Matrix;
};

export class TransformGizmo extends Container
{
    public editableView: EditableViewport;
    public config: TransformGizmoConfig;

    public visualPivot?: Point;

    public initialTransform: InitialGizmoTransform;
    public frame: TransformGizmoFrame;
    public matrixCache: Map<DisplayObjectNode, MatrixCache>;

    public vertex: HandleVertex;
    public operation?: TransformOperation;
    public dragInfo?: DragInfo;

    protected groupSizeContainer: Container;
    protected groupSizeGraphic: Graphics;

    protected lastClick: number;
    protected isDirty: boolean;

    constructor(editableView: EditableViewport, config: Partial<TransformGizmoConfig> = {})
    {
        super();

        this.editableView = editableView;
        this.lastClick = -1;
        this.isDirty = false;

        this.config = {
            ...defaultTransformGizmoConfig,
            ...config,
        };

        this.initialTransform = defaultInitialGizmoTransform;
        this.frame = new TransformGizmoFrame(this);
        this.vertex = { h: 'none', v: 'none' };
        this.matrixCache = new Map();

        this.groupSizeContainer = new Container();
        this.groupSizeGraphic = new Graphics();
        this.groupSizeContainer.addChild(this.groupSizeGraphic);
        this.groupSizeContainer.visible = false;
        this.editableView.stage.addChild(this.groupSizeContainer);

        this.hide();

        this.initFrame();

        globalEmitter
            .on('selection.add', this.updateSelection)
            .on('selection.remove', this.updateSelection)
            .on('selection.deselect', this.onSelectionDeselect)
            .on('datastore.remote.node.model.modified', this.updateSelection)
            .on('command.undo', this.updateSelection)
            .on('command.redo', this.updateSelection)
            .on('datastore.remote.node.removed', this.updateSelection)
            .on('datastore.remote.node.created', this.updateSelection);
    }

    get selection()
    {
        return Application.instance.selection;
    }

    protected updateSelection = () =>
    {
        const { selection: { isSingle, isMulti, isEmpty, nodes } } = Application.instance;

        if (isSingle)
        {
            this.updateSingleSelectionNode();
        }
        else if (isMulti)
        {
            this.selectNodes(nodes);
        }
        else if (isEmpty)
        {
            this.onSelectionDeselect();
        }
    };

    protected onSelectionDeselect = () =>
    {
        const { selection } = this;

        selection.nodes.forEach((node) => (node.view.interactive = false));

        this.matrixCache.clear();

        this.hide();
    };

    protected updateSingleSelectionNode()
    {
        const { selection: { nodes } } = Application.instance;

        this.selectNode(nodes[0]);
    }

    protected getCachedMatrix(node: DisplayObjectNode): MatrixCache
    {
        return this.matrixCache.get(node) as MatrixCache;
    }

    protected wasDoubleClick()
    {
        return this.lastClick > -1
            && Date.now() - this.lastClick < dblClickMsThreshold;
    }

    get isVertexDrag()
    {
        if (this.vertex)
        {
            return this.vertex.h !== 'none' && this.vertex.v !== 'none';
        }

        return false;
    }

    get localX()
    {
        const { selection } = this;

        if (selection.length === 1)
        {
            return selection.nodes[0].view.x;
        }

        return this.x;
    }

    get localY()
    {
        const { selection } = this;

        if (selection.length === 1)
        {
            return selection.nodes[0].view.y;
        }

        return this.y;
    }

    get x()
    {
        return this.transform.position.x;
    }

    set x(x: number)
    {
        this.transform.position.x = x;
    }

    get y()
    {
        return this.transform.position.y;
    }

    set y(y: number)
    {
        this.transform.position.y = y;
    }

    get pivotX()
    {
        return this.transform.pivot.x;
    }

    set pivotX(x: number)
    {
        this.transform.pivot.x = x;
    }

    get pivotY()
    {
        return this.transform.pivot.y;
    }

    set pivotY(y: number)
    {
        this.transform.pivot.y = y;
    }

    get visualPivotGlobalPos()
    {
        const { worldTransform, visualPivot } = this;

        if (visualPivot)
        {
            return worldTransform.apply({ x: visualPivot.x, y: visualPivot.y });
        }

        return this.transformPivotGlobalPos;
    }

    get transformPivotGlobalPos()
    {
        const { worldTransform, transform } = this;

        return worldTransform.apply({ x: transform.pivot.x, y: transform.pivot.y });
    }

    get pivotGlobalPos()
    {
        return this.visualPivot ? this.visualPivotGlobalPos : this.transformPivotGlobalPos;
    }

    get rotation()
    {
        return radToDeg(this.transform.rotation);
    }

    set rotation(deg: number)
    {
        this.transform.rotation = degToRad(deg);
    }

    get scaleX()
    {
        return this.transform.scale.x;
    }

    set scaleX(x: number)
    {
        this.transform.scale.x = x;
    }

    get scaleY()
    {
        return this.transform.scale.y;
    }

    set scaleY(y: number)
    {
        this.transform.scale.y = y;
    }

    get gridXUnit()
    {
        return Application.instance.gridSettings.smallUnit;
    }

    get gridYUnit()
    {
        return Application.instance.gridSettings.smallUnit;
    }

    public get isInteractive()
    {
        return this.frame.border.interactive;
    }

    public set isInteractive(value: boolean)
    {
        this.frame.border.interactive = value;
    }

    public get isVisible()
    {
        return this.frame.container.visible;
    }

    protected initFrame()
    {
        const { frame } = this;

        frame
            .on('mousedown', (e: InteractionEvent) =>
            {
                this.setActiveVertex({ h: 'none', v: 'none' });
                this.onMouseDown(e);
            })
            .on('mousemove', this.onMouseMove)
            .on('mouseup', this.onMouseUp);
    }

    public show()
    {
        const { frame: { container } } = this;

        if (!container.visible)
        {
            container.visible = true;
        }
    }

    public hide()
    {
        const { frame: { container } } = this;

        if (container.visible)
        {
            container.visible = false;
        }
    }

    public setContainer(container: Container)
    {
        container.addChild(this.frame.container);
    }

    public setVisualPivot(x: number, y: number)
    {
        this.visualPivot = {
            x,
            y,
        };
    }

    public setConfig(config: Partial<TransformGizmoConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        if (config.pivotView)
        {
            this.frame.setPivotView(config.pivotView);
        }
    }

    public setActiveVertex(vertex: HandleVertex)
    {
        this.vertex = vertex;
    }

    public constrainLocalPoint(localPoint: {x: number; y: number})
    {
        const { initialTransform: { width, height } } = this;

        localPoint.x = Math.min(width, Math.max(0, localPoint.x));
        localPoint.y = Math.min(height, Math.max(0, localPoint.y));
    }

    public setPivot(localX: number, localY: number)
    {
        this.updateTransform();

        const p1 = this.localTransform.apply({ x: localX, y: localY });

        this.transform.pivot.x = localX;
        this.transform.pivot.y = localY;

        this.updateTransform();

        const p2 = this.localTransform.apply({ x: localX, y: localY });

        const deltaX = p1.x - p2.x;
        const deltaY = p1.y - p2.y;

        this.x += deltaX;
        this.y += deltaY;
    }

    protected updateDragInfoFromEvent(event: InteractionEvent)
    {
        const { dragInfo } = this;

        if (dragInfo)
        {
            const parentMatrix = this.parent.worldTransform;
            const eventGlobalX = event.data.global.x;
            const eventGlobalY = event.data.global.y;
            const globalPoint = { x: eventGlobalX, y: eventGlobalY };
            const { x: globalX, y: globalY } = parentMatrix.applyInverse(globalPoint);
            const { x: localX, y: localY } = this.worldTransform.applyInverse(globalPoint);

            dragInfo.globalX = globalX;
            dragInfo.globalY = globalY;
            dragInfo.localX = localX;
            dragInfo.localY = localY;
            dragInfo.isShiftDown = event.data.originalEvent.shiftKey;
            dragInfo.isAltDown = event.data.originalEvent.altKey;
            dragInfo.isMetaDown = event.data.originalEvent.metaKey;
            dragInfo.isControlDown = event.data.originalEvent.ctrlKey;
            dragInfo.buttons = event.data.buttons;
            dragInfo.event = event;
        }
    }

    protected setOperation(operation: TransformOperation)
    {
        this.operation = operation;
    }

    public onMouseDown = (event: InteractionEvent) =>
    {
        const isShiftKeyPressed = event.data.originalEvent.shiftKey;
        const isSpacePressed = isKeyPressed(' ');
        const wasDrillDownClick = this.wasDoubleClick() || isShiftKeyPressed;

        if (isSpacePressed)
        {
            return;
        }

        if (wasDrillDownClick)
        {
            this.emit('drilldown', event);

            return;
        }

        this.dragInfo = {
            ...defaultDragInfo,
            event,
        };

        this.updateDragInfoFromEvent(event);

        const {
            dragInfo: { isMetaDown, isAltDown },
            isVertexDrag,
            config,
        } = this;

        if (isMetaDown && !isAltDown)
        {
            // rotation
            config.enableRotation && this.setOperation(new RotateOperation(this));
        }
        else if (isVertexDrag)
        {
            // scaling
            const { defaultScaleMode } = config;
            const PrimaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByEdgeOperation : ScaleByPivotOperation;
            const SecondaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByPivotOperation : ScaleByEdgeOperation;

            if (isMetaDown && isAltDown)
            {
                // secondary scale operation (scale by pivot)
                config.enableScaling && this.setOperation(new SecondaryScaleOperation(this));
            }
            else
            {
                // primary scale operation (scale by edge)
                config.enableScaling && this.setOperation(new PrimaryScaleOperation(this));
            }
        }
        else if (isAltDown)
        {
            // translate pivot
            config.enablePivotTranslation && this.setOperation(new TranslatePivotOperation(this));

            // pivot modifies transform instantly, doesn't need a mousemove event
            this.isDirty = true;
        }
        else
        {
            // translation
            config.enableTranslation && this.setOperation(new TranslateOperation(this));
        }

        if (this.operation)
        {
            // start the operation
            this.operation.init(this.dragInfo);
            this.operation.drag(this.dragInfo);
        }

        this.update();

        this.frame.startOperation(this.dragInfo);

        this.lastClick = Date.now();

        globalEmitter.emit('transform.start', this);
    };

    public onMouseMove = (event: InteractionEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.isDirty = true;
            this.updateDragInfoFromEvent(event);
            this.operation.drag(this.dragInfo);

            this.update();
            this.frame.updateOperation(this.dragInfo);

            globalEmitter.emit('transform.modify', this);
        }
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp = (event: MouseEvent) =>
    {
        const { selection } = this;

        if (selection.isEmpty)
        {
            return;
        }

        if (this.operation && this.dragInfo)
        {
            this.operation.end(this.dragInfo);
            this.update();
            this.frame.endOperation(this.dragInfo);
            this.clearOperation();

            if (this.isDirty)
            {
                this.updateSelectedModels();
                this.isDirty = false;
            }

            globalEmitter.emit('transform.end', this);
        }

        this.emit('mouseup');
    };

    public clearOperation()
    {
        this.vertex = { h: 'none', v: 'none' };

        delete this.operation;
        delete this.dragInfo;
    }

    public getContentGlobalBounds()
    {
        return getTotalGlobalBounds(this.selection.nodes);
    }

    public update()
    {
        if (this.selection.isEmpty)
        {
            return;
        }

        this.transform.updateLocalTransform();
        this.updateTransform();
        this.updateSelectedTransforms();
        this.frame.update();

        if (!this.isVisible)
        {
            this.show();
        }
    }

    get matrix()
    {
        const m = this.worldTransform.clone();

        return m;
    }

    public onRootContainerChanged()
    {
        this.update();
    }

    public selectNode<T extends DisplayObjectNode>(node: T)
    {
        const initialTransform = getGizmoInitialTransformFromView(node.view, node.naturalWidth, node.naturalWidth, this.parent.worldTransform);

        this.initNodes([node], initialTransform, bluePivot);
    }

    public selectNodes<T extends DisplayObjectNode>(nodes: T[])
    {
        const rect = getTotalGlobalBounds(nodes);

        const { groupSizeContainer, groupSizeGraphic } = this;

        groupSizeGraphic.clear();
        groupSizeGraphic.beginFill();
        groupSizeGraphic.drawRect(0, 0, rect.width, rect.height);
        groupSizeGraphic.endFill();

        groupSizeContainer.pivot.x = rect.width * 0.5;
        groupSizeContainer.pivot.y = rect.height * 0.5;
        groupSizeContainer.x = rect.left + groupSizeContainer.pivot.x;
        groupSizeContainer.y = rect.top + groupSizeContainer.pivot.y;

        groupSizeContainer.visible = true;

        const initialTransform = getGizmoInitialTransformFromView(groupSizeContainer, rect.width, rect.height, this.parent.worldTransform);

        groupSizeContainer.visible = false;

        this.initNodes(nodes, initialTransform, yellowPivot);
    }

    protected initNodes<T extends DisplayObjectNode>(nodes: T[], initialTransform: InitialGizmoTransform, pivotView: Graphics | SmoothGraphics)
    {
        this.initialTransform = initialTransform;

        this.transform.pivot.x = initialTransform.pivotX;
        this.transform.pivot.y = initialTransform.pivotY;
        this.transform.position.x = initialTransform.x;
        this.transform.position.y = initialTransform.y;
        this.transform.rotation = degToRad(initialTransform.rotation);
        this.transform.scale.x = initialTransform.scaleX;
        this.transform.scale.y = initialTransform.scaleY;
        this.transform.skew.x = initialTransform.skewX;
        this.transform.skew.y = initialTransform.skewY;

        nodes.forEach((node) =>
        {
            const view = node.view;

            view.updateTransform();

            view.interactive = true;

            this.matrixCache.set(node, {
                local: view.localTransform.clone(),
                world: view.worldTransform.clone(),
            });
        });

        this.setConfig({ pivotView });

        this.update();
    }

    protected updateSelectedTransforms()
    {
        const { selection } = this;

        if (selection.length === 1)
        {
            const node = selection.nodes[0];
            const view = node.getView();
            const cachedMatrix = this.getCachedMatrix(node);

            const matrix = new Matrix();

            matrix.append(view.parent.worldTransform.clone().invert());
            matrix.append(cachedMatrix.world);
            matrix.append(this.initialTransform.matrix.clone().invert());
            matrix.append(this.worldTransform);

            view.transform.setFromMatrix(matrix);
        }
        else
        {
            selection.forEach((node) =>
            {
                const view = node.getView();
                const cachedMatrix = this.getCachedMatrix(node);

                const matrix = new Matrix();

                matrix.append(view.parent.worldTransform.clone().invert());
                matrix.append(this.worldTransform);
                matrix.append(this.initialTransform.matrix.clone().invert());
                matrix.append(cachedMatrix.world);

                view.transform.setFromMatrix(matrix);
            });
        }
    }

    protected updateSelectedModels()
    {
        const { selection } = this;
        const modifications: ModifyModelCommandParams<any>[] = [];

        selection.forEach((node) =>
        {
            const view = node.view;

            view.updateTransform();

            const pivotX = this.pivotX;
            const pivotY = this.pivotY;

            const x = view.x;
            const y = view.y;
            const scaleX = view.scale.x;
            const scaleY = view.scale.y;

            const matrix = view.worldTransform.clone();

            if (view.parent)
            {
                const parentMatrix = view.parent.worldTransform.clone();

                parentMatrix.invert();
                matrix.prepend(parentMatrix);
            }

            const transform = new Transform();

            decomposeTransform(transform, matrix, undefined, { x: pivotX, y: pivotY } as any);

            const angle = radToDeg(transform.rotation);
            const skewX = transform.skew.x;
            const skewY = transform.skew.y;

            const values: Partial<DisplayObjectModel> = {
                x,
                y,
                scaleX,
                scaleY,
                angle,
                skewX,
                skewY,
            };

            if (selection.length === 1)
            {
                const p1 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });
                const p2 = matrix.apply({ x: pivotX, y: pivotY });
                const deltaX = p2.x - p1.x;
                const deltaY = p2.y - p1.y;

                values.pivotX = pivotX;
                values.pivotY = pivotY;

                values.x = x + deltaX;
                values.y = y + deltaY;
            }

            modifications.push({
                nodeId: node.id,
                values,
            });
        });

        Application.instance.undoStack.exec(new ModifyModelsCommand({ modifications }));
    }
}
