import type { InteractionEvent } from 'pixi.js';
import { Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { getGlobalEmitter } from '../../core/events';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { Application } from '../application';
import type { GlobalKeyboardEvent } from '../events/keyboardEvents';
import { Grid } from './grid';
import GridRenderer from './gridRenderer';
import { isKeyPressed } from './keyboard';
import { TransformGizmo } from './transform/gizmo';

const globalEmitter = getGlobalEmitter<GlobalKeyboardEvent>();

export class EditableView
{
    public rootNode: ContainerNode;
    public canvas: HTMLCanvasElement;
    public pixi: PixiApplication;
    public transformGizmo: TransformGizmo;
    public gridLayer: Container;
    public nodeLayer: Container;
    public editLayer: Container;
    public viewport: Viewport;
    public grid: Grid;

    constructor(rootNode: ContainerNode)
    {
        this.rootNode = rootNode;

        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

        const grid = this.grid = new Grid();

        pixi.stage.addChild(grid);

        const viewport = this.viewport = new Viewport();

        pixi.stage.addChild(viewport);

        const gridLayer = this.gridLayer = new Container();
        const nodeLayer = this.nodeLayer = new Container();
        const editLayer = this.editLayer = new Container();

        const gizmo = this.transformGizmo = new TransformGizmo(pixi.stage);

        viewport.addChild(gridLayer);
        viewport.addChild(nodeLayer);
        viewport.addChild(gizmo);
        pixi.stage.addChild(editLayer);

        // gridLayer.addChild(GridRenderer.createTilingSprite(screen.availWidth, screen.availHeight));
        nodeLayer.addChild(rootNode.view);
        editLayer.addChild(gizmo.frame.container);

        gizmo
            .on('mouseup', this.onMouseUp)
            .on('dblclick', this.onDblClick);

        viewport
            .on('mousedown', this.onMouseDown)
            .on('mouseup', this.onMouseUp)
            .on('moved', this.onViewportChanged);

        viewport
            .drag()
            .pinch()
            .wheel();

        globalEmitter
            .on('key.down', this.onKeyDown)
            .on('key.up', this.onKeyUp);
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

    protected onDblClick = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => !selection.has(node));
        const topNode = underCursor[0];

        if (underCursor.length > 0)
        {
            Application.instance.selection.set(topNode);
        }
    };

    protected onMouseDown = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => !selection.has(node));
        const topNode = underCursor[0];
        const isSpacePressed = this.isSpaceKeyDown;
        const isShiftKeyPressed = e.data.originalEvent.shiftKey;
        const isMetaKeyPressed = e.data.originalEvent.shiftKey;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;

        if (isSpacePressed)
        {
            // don't select anything when panning view
            this.viewport.cursor = 'grabbing';

            return;
        }

        if (this.transformGizmo.frame.getGlobalBounds().contains(globalX, globalY) && isAddKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => selection.has(node));
            const topNode = underCursor[0];

            selection.remove(topNode);
        }

        // click outside of transform gizmo area
        if (underCursor.length === 0)
        {
            // nothing selected, deselect
            selection.deselect();
        }
        else
        {
            const selectedNode = topNode.getCloneRoot().cast<DisplayObjectNode>();
            // const selectedNode = topNode;

            if (isAddKey)
            {
                // add to selection
                selection.add(topNode);
            }
            else
            {
                // new selection and start dragging
                this.selectWithDrag(selectedNode, e);
            }
        }
    };

    protected onMouseUp = () =>
    {
        this.viewport.cursor = this.isSpaceKeyDown ? 'grab' : 'default';
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
            const bounds = node.getGlobalBounds();

            if (bounds.contains(globalX, globalY) && !node.isMetaNode)
            {
                underCursor.push(node);
            }
        });

        underCursor.reverse();

        return underCursor;
    }

    public setRoot(rootNode: ContainerNode)
    {
        const { nodeLayer } = this;

        nodeLayer.removeChild(this.rootNode.view);
        this.rootNode = rootNode;
        nodeLayer.addChild(rootNode.view);
    }

    public setContainer(container: HTMLDivElement)
    {
        this.pixi.resizeTo = container;
        container.appendChild(this.canvas);
    }
}
