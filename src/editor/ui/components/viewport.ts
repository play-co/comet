import { type InteractionEvent, Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import type { ClonableNode } from '../../../core';
import { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { ContainerNode } from '../../../core/nodes/concrete/display/containerNode';
import { Application } from '../../core/application';
import Events from '../../events';
import { TransformGizmo } from '../transform/gizmo';
import { BoxSelection } from './boxSelection';
import { Grid } from './grid';
import { isKeyPressed } from './keyboardListener';

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

    constructor()
    {
        this.rootNode = new ContainerNode();

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

        nodeLayer.addChild(this.rootNode.view);
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
            .decelerate()
            .wheel();

        Events.key.down.bind(this.onKeyDown);
        Events.key.up.bind(this.onKeyUp);
        Events.viewport.resize.bind(this.onResize);
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
        const { hierarchy: selection } = Application.instance.selection;
        const underCursor = this.findNodesAtPoint(globalX, globalY);
        const topNode = underCursor[0];

        if (underCursor.length > 0)
        {
            if (isAddKey)
            {
                if (selection.deepContains(topNode))
                {
                    if (selection.shallowContains(topNode))
                    {
                        // remove selection if a child of currently selected node is clicked and selected
                        selection.remove(topNode);
                    }
                    else
                    {
                        // add new node to selection
                        selection.add(topNode);
                    }
                }
                else
                {
                    // add new node to selection
                    selection.add(topNode);
                }
            }
            else
            {
                selection.set(topNode);
            }
        }
    };

    protected onMouseDown = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { hierarchy: selection } = Application.instance.selection;
        const underCursor = this.findNodesAtPoint(globalX, globalY).filter((node) => !selection.deepContains(node));
        const topNode = underCursor[0];
        const isSpacePressed = this.isSpaceKeyDown;
        const isShiftKeyPressed = e.data.originalEvent.shiftKey;
        const isMetaKeyPressed = e.data.originalEvent.metaKey;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;
        const gizmoFrameBounds = this.transformGizmo.frame.getGlobalBounds();

        this.viewport.pause = !isSpacePressed;

        if (isSpacePressed)
        {
            // don't select anything when panning view
            this.viewport.cursor = 'grabbing';

            return;
        }

        if (gizmoFrameBounds.contains(globalX, globalY) && isAddKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const nodes = this.findNodesAtPoint(globalX, globalY);
            const underCursor = nodes.filter((node) => selection.deepContains(node));
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
            const selectedNode = topNode.getCloneRoot();

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
            const { hierarchy: selection } = Application.instance.selection;
            const nodes = boxSelection.selectWithinRootNode(this.rootNode);

            selection.deselect();

            if (nodes.length > 0)
            {
                if (nodes.length === 1)
                {
                    selection.set(nodes[0]);
                }
                else
                {
                    selection.set(nodes);
                }
            }
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

    protected selectWithDrag(selectedNode: ClonableNode, e: InteractionEvent)
    {
        Application.instance.selection.hierarchy.set(selectedNode);

        if (this.transformGizmo.config.enableTranslation)
        {
            this.transformGizmo.onMouseDown(e);
        }
    }

    protected findNodesAtPoint(globalX: number, globalY: number)
    {
        const underCursor: ClonableNode[] = [];

        this.rootNode.walk<DisplayObjectNode>((node) =>
        {
            if (
                node instanceof DisplayObjectNode
                 && node.containsPoint(globalX, globalY)
                 && !node.isMetaNode
                  && !node.isCloaked
                   && node.model.getValue<boolean>('visible')
            )
            {
                underCursor.push(node.cast());
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

    public unmount(container: HTMLElement)
    {
        container.removeChild(this.canvas);
    }

    public setRoot(node: DisplayObjectNode)
    {
        this.nodeLayer.removeChild(this.rootNode.view);
        this.rootNode = node;
        this.nodeLayer.addChild(this.rootNode.view);

        Events.viewport.rootChanged.emit(node);
    }

    public getMousePos(clientX: number, clientY: number)
    {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return { x, y };
    }

    public getLocalPoint(globalX: number, globalY: number)
    {
        return this.viewport.toLocal({ x: globalX, y: globalY });
    }
}
