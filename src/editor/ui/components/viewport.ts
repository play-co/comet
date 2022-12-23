import type { InteractionEvent } from 'pixi.js';
import { Application as PixiApplication, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import type { ClonableNode } from '../../../core';
import { DisplayObjectNode } from '../../../core/nodes/abstract/displayObjectNode';
import { ContainerNode } from '../../../core/nodes/concrete/display/containerNode';
import { SceneNode } from '../../../core/nodes/concrete/meta/sceneNode';
import { Application, getApp } from '../../core/application';
import { loadUserViewportPrefs, saveUserViewportPrefs } from '../../core/userPrefs';
import Events from '../../events';
import { TransformGizmo } from '../transform/gizmo';
import { BoxSelection } from './boxSelection';
import { Grid } from './grid';
import { isKeyPressed } from './keyboardListener';

const blankNode = new ContainerNode();

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
        this.rootNode = blankNode;

        const pixi = this.pixi = new PixiApplication({
            backgroundColor: 0x111111,
        });

        const canvas = this.canvas = pixi.renderer.view;

        canvas.classList.add('viewport');
        canvas.classList.add('hide-viewport');

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

        const app = getApp();

        app.statusBar.addItem('x.label', { text: 'x:' });
        app.statusBar.addItem('x.value', { style: 'value', text: ' ', width: 60 });
        app.statusBar.addItem('y.label', { text: 'y:' });
        app.statusBar.addItem('y.value', { style: 'value', text: ' ', width: 60 });

        gizmo
            .on('mouseup', this.onMouseUp)
            .on('drilldown', this.onDrillDownClick);

        viewport
            .on('mousedown', this.onMouseDown)
            .on('mouseup', this.onMouseUp)
            .on('mousemove', this.onMouseMove)
            .on('moved', this.onViewportChanged)
            .on('moved-end', () =>
            {
                this.onViewportChanged();
                saveUserViewportPrefs();
            })
            .on('zoomed-end', () =>
            {
                this.onViewportChanged();
                saveUserViewportPrefs();
            });

        viewport
            .drag()
            .pinch()
            .decelerate()
            .wheel();

        Events.key.down.bind(this.onKeyDown);
        Events.key.up.bind(this.onKeyUp);
        Events.editor.resize.bind(this.onResize);
        Events.datastore.node.local.cloaked.bind(this.onNodeCloaked);
        Events.project.ready.bind(() =>
        {
            this.loadPrefs();
            this.canvas.classList.remove('hide-viewport');
        });
    }

    get x()
    {
        return this.viewport.x;
    }

    get y()
    {
        return this.viewport.y;
    }

    get scale()
    {
        return this.viewport.scale.x;
    }

    get stage()
    {
        return this.pixi.stage;
    }

    get isSpaceKeyDown()
    {
        return isKeyPressed(' ');
    }

    protected loadPrefs()
    {
        const prefs = loadUserViewportPrefs();

        if (prefs)
        {
            const { x, y, scale } = prefs;

            this.viewport.x = x;
            this.viewport.y = y;
            this.viewport.scale.set(scale);
            this.onViewportChanged();
        }
    }

    protected onKeyDown = (e: KeyboardEvent) =>
    {
        if (e.key === ' ' && !this.boxSelection.isSelecting)
        {
            this.viewport.cursor = 'grab';
            this.transformGizmo.isInteractive = false;
        }
        else if (e.key === 'Escape')
        {
            Application.instance.selection.hierarchy.deselect();
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

        const { canvas, viewport } = this;
        const { statusBar } = getApp();
        const { x: globalX, y: globalY } = e.data.global;

        if (globalX >= 0 && globalX <= canvas.offsetWidth && globalY >= 0 && globalY <= canvas.offsetHeight)
        {
            const pos = viewport.toLocal({ x: globalX, y: globalY });
            const gx = pos.x.toFixed(1);
            const gy = pos.y.toFixed(1);

            statusBar.getItem('x.value').label = gx;
            statusBar.getItem('y.value').label = gy;
        }
    };

    protected onMouseUp = () =>
    {
        const { viewport, isSpaceKeyDown } = this;

        viewport.pause = false;
        viewport.cursor = isSpaceKeyDown ? 'grab' : 'default';
    };

    public onViewportChanged = () =>
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

    public findNodesAtPoint(globalX: number, globalY: number)
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
        const { canvas, pixi, grid, viewport } = this;
        const container = canvas.parentElement as HTMLDivElement;

        if (container)
        {
            const width = container.clientWidth;
            const height = container.clientHeight;

            pixi.renderer.resize(width, height);
            viewport.resize(width, height);

            grid.renderGrid();
        }
    };

    public onNodeCloaked = (node: ClonableNode) =>
    {
        if (node.id === this.rootNode.id)
        {
            const app = Application.instance;

            app.selection.hierarchy.deselect();
            const sceneFolder = app.project.getRootFolder('Scenes');
            const scenes = sceneFolder.getAllChildrenByType(SceneNode);

            this.setRoot(scenes[scenes.length - 1].cast<SceneNode>());
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

        saveUserViewportPrefs();

        Events.viewport.rootChanged.emit(node);
    }

    public getMousePos(clientX: number, clientY: number)
    {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return { x, y };
    }

    public getMouseLocalPoint(e: {clientX: number; clientY: number})
    {
        const clientPos = { x: e.clientX, y: e.clientY };
        const viewportMousePos = this.getMousePos(clientPos.x, clientPos.y);

        return this.getLocalPoint(viewportMousePos.x, viewportMousePos.y);
    }

    public getLocalPoint(globalX: number, globalY: number)
    {
        return this.viewport.toLocal({ x: globalX, y: globalY });
    }

    public getGlobalPoint(localX: number, localY: number)
    {
        return this.viewport.toGlobal({ x: localX, y: localY });
    }

    public getVisibleBounds()
    {
        return this.viewport.getVisibleBounds();
    }
}
