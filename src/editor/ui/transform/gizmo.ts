import type { InteractionEvent } from 'pixi.js';
import { Container, Graphics, Matrix, Transform } from 'pixi.js';

import { getGlobalEmitter } from '../../../core/events';
import type { DisplayObjectModel, DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { type Point, degToRad, radToDeg } from '../../../core/util/geom';
import { Application } from '../../application';
import { ModifyModelCommand } from '../../commands/modifyModel';
import type { CommandEvent } from '../../events/commandEvents';
import type { DatastoreEvent } from '../../events/datastoreEvents';
import type { SelectionEvent } from '../../events/selectionEvents';
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
    bluePivot,     decomposeTransform,
    defaultInitialGizmoTransform,
    getGizmoInitialTransformFromView,
    getTotalGlobalBounds,
    updateTransforms,
    yellowPivot,
} from './util';

const globalEmitter = getGlobalEmitter<DatastoreEvent & CommandEvent & SelectionEvent>();

export class TransformGizmo extends Container
{
    public stage: Container;
    public config: TransformGizmoConfig;

    public visualPivot?: Point;

    public initialTransform: InitialGizmoTransform;
    public frame: TransformGizmoFrame;
    public matrixCache: Map<DisplayObjectNode, Matrix>;

    public vertex: HandleVertex;
    public operation?: TransformOperation;
    public dragInfo?: DragInfo;

    constructor(stage: Container, config: Partial<TransformGizmoConfig> = {})
    {
        super();

        this.stage = stage;

        this.config = {
            ...defaultTransformGizmoConfig,
            ...config,
        };

        this.initialTransform = defaultInitialGizmoTransform;
        this.frame = new TransformGizmoFrame(this);
        this.vertex = { h: 'none', v: 'none' };
        this.matrixCache = new Map();

        this.hide();

        this.initFrame();

        globalEmitter
            .on('selection.add', this.updateSelection)
            .on('selection.remove', this.updateSelection)
            .on('selection.deselect', this.onSelectionDeselect)
            .on('datastore.node.model.modified', this.updateSelection)
            .on('datastore.node.removed', this.updateSelection)
            .on('datastore.node.created', this.updateSelection);
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
            // this.selectMultipleNodes(nodes);
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
        return 10;
    }

    get gridYUnit()
    {
        return 10;
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
            config.enableRotation && this.setOperation(new RotateOperation(this));
        }
        else if (isVertexDrag)
        {
            const { defaultScaleMode } = config;
            const PrimaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByEdgeOperation : ScaleByPivotOperation;
            const SecondaryScaleOperation = defaultScaleMode === 'edge' ? ScaleByPivotOperation : ScaleByEdgeOperation;

            if (isMetaDown && isAltDown)
            {
                config.enableScaling && this.setOperation(new SecondaryScaleOperation(this));
            }
            else
            {
                config.enableScaling && this.setOperation(new PrimaryScaleOperation(this));
            }
        }
        else if (isAltDown)
        {
            config.enablePivotTranslation && this.setOperation(new TranslatePivotOperation(this));
        }
        else
        {
            config.enableTranslation && this.setOperation(new TranslateOperation(this));
        }

        if (this.operation)
        {
            this.operation.init(this.dragInfo);
            this.operation.drag(this.dragInfo);
        }

        this.update();

        this.frame.startOperation(this.dragInfo);
    };

    public onMouseMove = (event: InteractionEvent) =>
    {
        if (this.operation && this.dragInfo)
        {
            this.updateDragInfoFromEvent(event);
            this.operation.drag(this.dragInfo);

            this.update();
            this.frame.updateOperation(this.dragInfo);

            event.stopPropagation();
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

            event.stopPropagation();
        }

        this.clearOperation();
        this.updateSelectedModels();

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

        this.select([node], initialTransform, bluePivot);
    }

    public selectNodes<T extends DisplayObjectNode>(nodes: T[])
    {
        const rect = getTotalGlobalBounds(nodes);

        const container = new Container();
        const graphics = new Graphics();

        graphics.beginFill(0xffffff, 0.5);
        graphics.drawRect(0, 0, rect.width, rect.height);
        graphics.endFill();

        container.pivot.x = rect.width * 0.5;
        container.pivot.y = rect.height * 0.5;
        container.x = rect.left + container.pivot.x;
        container.y = rect.top + container.pivot.y;
        container.addChild(graphics);

        this.stage.addChild(container);

        const initialTransform = getGizmoInitialTransformFromView(container, rect.width, rect.height, this.parent.worldTransform);

        this.stage.removeChild(container);

        this.select(nodes, initialTransform, yellowPivot);
    }

    protected select<T extends DisplayObjectNode>(nodes: T[], initialTransform: InitialGizmoTransform, pivotView: Graphics)
    {
        this.initTransform(initialTransform);

        nodes.forEach((node) => this.initNode(node));

        this.setConfig({ pivotView });

        this.update();
    }

    protected initTransform(initialTransform: InitialGizmoTransform)
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
    }

    protected initNode(node: DisplayObjectNode)
    {
        const view = node.view;

        updateTransforms(view);

        view.interactive = true;

        this.matrixCache.set(node, view.worldTransform.clone());
    }

    protected updateSelectedTransforms()
    {
        const { selection } = this;

        selection.forEach((node) =>
        {
            const view = node.getView();
            const matrix = new Matrix();
            const cachedMatrix = (this.matrixCache.get(node) as Matrix).clone();

            matrix.append(view.parent.worldTransform.clone().invert());
            matrix.append(cachedMatrix);
            matrix.append(this.initialTransform.matrix.clone().invert());
            matrix.append(this.worldTransform.clone());

            view.transform.setFromMatrix(matrix);
        });
    }

    protected updateSelectedModels()
    {
        const { selection } = this;

        selection.forEach((node) =>
        {
            const view = node.view;

            updateTransforms(view);

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
                values.pivotX = pivotX;
                values.pivotY = pivotY;
            }

            Application.instance.undoStack.exec(new ModifyModelCommand({
                nodeId: node.id,
                values,
            }));

            view.transform.setFromMatrix(matrix);
        });
    }
}
