import type { InteractionEvent } from 'pixi.js';
import { Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { getGlobalEmitter } from '../../core/events';
import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { Application } from '../application';
import type { GlobalKeyboardEvent } from '../events/keyboardEvents';
import Grid from './grid';
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

    constructor(rootNode: ContainerNode)
    {
        this.rootNode = rootNode;

        const canvas = this.canvas = document.createElement('canvas');

        const pixi = this.pixi = new PixiApplication({
            view: canvas,
            backgroundColor: 0x111111,
        });

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

        gridLayer.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
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

        globalEmitter.on('key.down', (e) =>
        {
            if (e.key === ' ')
            {
                viewport.cursor = 'grab';
            }
        }).on('key.up', (e) =>
        {
            if (e.key === ' ')
            {
                viewport.cursor = 'default';
            }
        });
    }

    protected onDblClick = (e: InteractionEvent) =>
    {
        const globalX = e.data.global.x;
        const globalY = e.data.global.y;
        const { selection } = Application.instance;
        const underCursor = this.getUnderCursor(globalX, globalY).filter((node) => !selection.has(node));
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
        const underCursor = this.getUnderCursor(globalX, globalY).filter((node) => !selection.has(node));
        const topNode = underCursor[0];
        const isSpacePressed = isKeyPressed(' ');
        const isShiftKeyPressed = e.data.originalEvent.shiftKey;
        const isMetaKeyPressed = e.data.originalEvent.shiftKey;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;

        if (!this.transformGizmo.frame.getGlobalBounds().contains(globalX, globalY))
        {
            // click outside of transform gizmo area
            if (underCursor.length === 0)
            {
                if (!isSpacePressed)
                {
                    // nothing selected, deselect
                    selection.deselect();
                }
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
        }
        else if (isAddKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const underCursor = this.getUnderCursor(globalX, globalY).filter((node) => selection.has(node));
            const topNode = underCursor[0];

            selection.remove(topNode);
        }

        this.viewport.pause = !isSpacePressed;
    };

    protected onMouseUp = () =>
    {
        this.viewport.pause = false;
        this.viewport.cursor = 'default';
    };

    protected onViewportChanged = () =>
    {
        this.viewport.updateTransform();
        this.transformGizmo.onRootContainerChanged();
        this.viewport.cursor = 'grabbing';
    };

    protected selectWithDrag(selectedNode: DisplayObjectNode, e: InteractionEvent)
    {
        Application.instance.selection.set(selectedNode);

        if (this.transformGizmo.config.enableTranslation)
        {
            this.transformGizmo.onMouseDown(e);
        }
    }

    protected getUnderCursor(globalX: number, globalY: number)
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
