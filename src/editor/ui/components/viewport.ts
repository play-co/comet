import { type InteractionEvent, Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { getGlobalEmitter } from '../../../core/events';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { Application } from '../../core/application';
import type { GlobalKeyboardEvent } from '../../events/keyboardEvents';
import type { ViewportEvent } from '../../events/viewportEvents';
import { TransformGizmo } from '../transform/gizmo';
import { BoxSelection } from './boxSelection';
import { Grid } from './grid';
import { isKeyPressed } from './keyboardListener';

const keyboardEmitter = getGlobalEmitter<GlobalKeyboardEvent>();
const viewportEmitter = getGlobalEmitter<ViewportEvent>();

export class EditableViewport
{
    public rootNode: DisplayObjectNode;
    public canvas: HTMLCanvasElement;
    public pixi: PixiApplication;
    public transformGizmo: TransformGizmo;
    public nodeLayer: Container;
    public editLayer: Container;
    public viewport: Viewport;
    public grid: Grid;
    public boxSelection: BoxSelection;

    constructor(rootNode: DisplayObjectNode)
    {
        this.rootNode = rootNode;

        const pixi = this.pixi = new PixiApplication({
            backgroundColor: 0x111111,
        });

        const canvas = this.canvas = pixi.renderer.view;

        const grid = this.grid = new Grid(canvas);

        pixi.stage.addChild(grid);

        const viewport = this.viewport = new Viewport({
            divWheel: canvas,
            interaction: pixi.renderer.plugins.interaction,
        });

        pixi.stage.addChild(viewport);

        const nodeLayer = this.nodeLayer = new Container();
        const editLayer = this.editLayer = new Container();

        const gizmo = this.transformGizmo = new TransformGizmo(this);

        viewport.addChild(nodeLayer);
        viewport.addChild(gizmo);
        pixi.stage.addChild(editLayer);

        nodeLayer.addChild(rootNode.view);
        editLayer.addChild(gizmo.frame.container);

        const boxSelection = this.boxSelection = new BoxSelection();

        editLayer.addChild(boxSelection);

        gizmo
            .on('mouseup', this.onMouseUp)
            .on('drilldown', this.onDrillDownClick);

        viewport
            .on('mousedown', this.onMouseDown)
            .on('mouseup', this.onMouseUp)
            .on('mousemove', this.onMouseMove)
            .on('moved', this.onViewportChanged)
            .on('moved-end', this.onViewportChanged)
            .on('zoomed-end', this.onViewportChanged);

        viewport
            .drag()
            .pinch()
            .wheel();

        keyboardEmitter
            .on('key.down', this.onKeyDown)
            .on('key.up', this.onKeyUp);

        viewportEmitter
            .on('viewport.resize', this.onResize);
    }

    get stage()
    {
        return this.pixi.stage;
    }

    get isSpaceKeyDown()
    {
        return isKeyPressed(' ');
    }

    protected onKeyDown = (e: KeyboardEvent) =>
    {
        if (e.key === ' ')
        {
            this.viewport.cursor = 'grab';
            this.transformGizmo.isInteractive = false;
        }
    };

    protected onKeyUp = (e: KeyboardEvent) =>
    {
        if (e.key === ' ')
        {
            this.viewport.cursor = 'default';
            this.viewport.pause = false;
            this.transformGizmo.isInteractive = true;
        }
    };

    protected onDrillDownClick = (e: InteractionEvent) =>
    {
        const isShiftKeyPressed = e.data.originalEvent.shiftKey;
        const isMetaKeyPressed = e.data.originalEvent.metaKey;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const underCursor = this.findNodesAtPoint(globalX, globalY);
        const topNode = underCursor[0];

        if (underCursor.length > 0)
        {
            if (isAddKey)
            {
                if (selection.deepContains(topNode))
                {
                    // replace selection if a child of currently selected node
                    selection.set(topNode);
                }
                else
                {
                    // add new node to selection
                    selection.add(topNode);
                }
            }
            else
            {
                Application.instance.selection.set(topNode);
            }
        }
    };

    protected onMouseDown = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => !selection.deepContains(node));
        const topNode = underCursor[0];
        const isSpacePressed = this.isSpaceKeyDown;
        const isShiftKeyPressed = e.data.originalEvent.shiftKey;
        const isMetaKeyPressed = e.data.originalEvent.metaKey;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;

        this.viewport.pause = !isSpacePressed;

        if (isSpacePressed)
        {
            // don't select anything when panning view
            this.viewport.cursor = 'grabbing';

            return;
        }

        if (this.transformGizmo.frame.getGlobalBounds().contains(globalX, globalY) && isAddKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => selection.deepContains(node));
            const topNode = underCursor[0];

            selection.remove(topNode);
        }

        // click outside of transform gizmo area
        if (underCursor.length === 0)
        {
            // nothing selected, deselect
            selection.deselect();

            this.boxSelection.onMouseDown(e);
        }
        else
        {
            const selectedNode = topNode.getCloneRoot().cast<DisplayObjectNode>();

            if (isAddKey)
            {
                // add new node to selection
                selection.add(topNode);
            }
            else
            {
                // new selection and start dragging
                this.selectWithDrag(selectedNode, e);
            }
        }
    };

    protected onMouseMove = (e: InteractionEvent) =>
    {
        this.boxSelection.onMouseMove(e);
    };

    protected onMouseUp = () =>
    {
        const { viewport, boxSelection, isSpaceKeyDown } = this;

        viewport.pause = false;
        viewport.cursor = isSpaceKeyDown ? 'grab' : 'default';

        if (boxSelection.isSelecting)
        {
            const { selection } = Application.instance;
            const nodes = boxSelection.selectWithinRootNode(this.rootNode);

            selection.deselect();
            nodes.forEach((node) => selection.add(node));
        }

        this.boxSelection.onMouseUp();
    };

    protected onViewportChanged = () =>
    {
        this.viewport.updateTransform();
        this.transformGizmo.onRootContainerChanged();
        this.grid.setConfig({
            x: this.viewport.x,
            y: this.viewport.y,
            scale: this.viewport.scale.x,
        });
    };

    protected selectWithDrag(selectedNode: DisplayObjectNode, e: InteractionEvent)
    {
        Application.instance.selection.set(selectedNode);

        if (this.transformGizmo.config.enableTranslation)
        {
            this.transformGizmo.onMouseDown(e);
        }
    }

    protected findNodesAtPoint(globalX: number, globalY: number)
    {
        const underCursor: DisplayObjectNode[] = [];

        this.rootNode.walk<DisplayObjectNode>((node) =>
        {
            if (node.containsPoint(globalX, globalY) && !node.isMetaNode && !node.isCloaked)
            {
                underCursor.push(node);
            }
        });

        underCursor.reverse();

        return underCursor;
    }

    public onResize = () =>
    {
        const { canvas, pixi, grid } = this;
        const container = canvas.parentElement as HTMLDivElement;

        if (container)
        {
            const width = container.clientWidth;
            const height = container.clientHeight;

            pixi.renderer.resize(width, height);

            grid.draw();
        }
    };

    public mount(container: HTMLElement)
    {
        container.appendChild(this.canvas);
        this.onResize();
    }

    public setRoot(node: DisplayObjectNode)
    {
        this.nodeLayer.removeChild(this.rootNode.view);
        this.rootNode = node;
        this.nodeLayer.addChild(this.rootNode.view);

        viewportEmitter.emit('viewport.root.changed', node);
    }
}
