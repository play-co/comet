import type { ComponentItemConfig, LayoutConfig } from 'golden-layout';

import type { FactoryTypes } from './dockablePanelLayout';
import HierarchyPanel from './hierarchyPanel.svelte';
import ProjectPanel from './projectPanel.svelte';
import PropertiesPanel from './propertiesPanel.svelte';
import Viewport from './viewport.svelte';

export const factoryTypes: FactoryTypes = {
    Hierarchy: HierarchyPanel,
    Properties: PropertiesPanel,
    Project: ProjectPanel,
    Viewport,
};

const projectPanel: ComponentItemConfig = {
    id: 'project',
    title: 'Project',
    type: 'component',
    componentType: 'Project',
    size: '1fr',
    minWidth: 100,
};

const hierarchyPanel: ComponentItemConfig = {
    id: 'hierarchy',
    title: 'Hierarchy',
    type: 'component',
    componentType: 'Hierarchy',
    size: '1fr',
    minWidth: 100,
};

const viewport: ComponentItemConfig = {
    title: 'Viewport',
    type: 'component',
    componentType: 'Viewport',
    size: '1fr',
    header: {
        show: false,
    },
    // minSize: "100px",s
};

const properties: ComponentItemConfig = {
    id: 'properties',
    title: 'Properties',
    type: 'component',
    componentType: 'Properties',
    minWidth: 200,
};

export const layoutConfig: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            {
                type: 'stack',
                content: [
                    projectPanel,
                    hierarchyPanel,
                ],
            },
            {
                type: 'column',
                size: '2fr',
                content: [
                    viewport,
                ],
            },
            properties,
        ],
    },
    dimensions: {
        headerHeight: 30,
    },
};
