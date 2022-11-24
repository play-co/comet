import { type InteractionEvent, Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { getGlobalEmitter } from '../../../core/events';
import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../../core/nodes/concrete/container';
import { Application } from '../../core/application';
import type { GlobalKeyboardEvent } from '../../events/keyboardEvents';
import { TransformGizmo } from '../transform/gizmo';
import { BoxSelection } from './boxSelection';
import { Grid } from './grid';
import { isKeyPressed } from './keyboardListener';

const globalEmitter = getGlobalEmitter<GlobalKeyboardEvent>();

export class EditableView
{
    public title: string;
    public rootNode: ContainerNode;
    public container: HTMLDivElement;
    public pixi: PixiApplication;
    public transformGizmo: TransformGizmo;
    public nodeLayer: Container;
    public editLayer: Container;
    public viewport: Viewport;
    public grid: Grid;
    public boxSelection: BoxSelection;

    constructor(rootNode: ContainerNode, title: string)
    {
        this.title = title;
        this.rootNode = rootNode;

        const container = this.container = document.createElement('div');

        container.style.cssText = `
            display: block;
            width: 100%;
            height: 100%;
        `;

        const pixi = this.pixi = new PixiApplication({
            backgroundColor: 0x111111,
            resizeTo: container,
        });

        const canvas = pixi.renderer.view;

        container.appendChild(canvas);

        const grid = this.grid = new Grid(canvas);

        pixi.stage.addChild(grid);

        const viewport = this.viewport = new Viewport();

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

        globalEmitter
            .on('key.down', this.onKeyDown)
            .on('key.up', this.onKeyUp);
    }

    get stage()
    {
        return this.pixi.stage;
    }

    get isSpaceKeyDown()
    {
        return isKeyPressed(' ');
    }

    public init(container: HTMLDivElement)
    {
        // this.pixi.resizeTo = container;
        // container.appendChild(this.canvas);
        // this.grid.draw();
    }

    public mount(container: HTMLElement)
    {
        container.appendChild(this.container);
        this.pixi.resizeTo = container;
        debugger;
        this.pixi.resize();
        this.grid.draw();
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
            const nodes = boxSelection.select(this.rootNode);

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
            if (node.containsPoint(globalX, globalY) && !node.isMetaNode)
            {
                underCursor.push(node);
            }
        });

        underCursor.reverse();

        return underCursor;
    }

    // public resizeTo(container: HTMLElement)
    // {
    //     setTimeout(() =>
    //     {
    //         const width = container.offsetWidth;
    //         const height = container.offsetHeight;

    //         // this.canvas.width = width;
    //         // this.canvas.height = height;
    //         this.pixi.resizeTo = container;
    //         // this.pixi.renderer.resize(container.offsetWidth, container.offsetHeight);
    //         // this.pixi.resize();
    //     }, 0);
    // }
}
