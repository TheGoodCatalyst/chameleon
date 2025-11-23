/**
 * Compositor - Component orchestration engine
 * 
 * Analyzes agent intents and composes UI layouts from components
 */

import { ViewContent, ComponentLayer } from '../protocol/types';
import { DeploymentConfig } from './deployment-loader';
import { ComponentRegistry, ComponentInstance } from './component-registry';

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutType = 'grid' | 'stack' | 'canvas' | 'auto';

export interface LayoutConfig {
    type: LayoutType;
    columns?: number;
    gap?: string;
    direction?: 'horizontal' | 'vertical';
}

export interface ComposedView {
    id: string;
    layer: ComponentLayer;
    components: ViewContent[];
    layout: LayoutConfig;
    timestamp: number;
}

export interface ThemedView extends ComposedView {
    styleOverrides: Record<string, string>;
}

// ============================================================================
// Compositor Class
// ============================================================================

export class Compositor {
    private registry: ComponentRegistry;
    private views: Map<string, ComposedView>;

    constructor(registry: ComponentRegistry) {
        this.registry = registry;
        this.views = new Map();
    }

    /**
     * Compose a view from render intent and data
     */
    composeView(
        components: ViewContent[],
        layer: ComponentLayer = 'focus',
        layoutType: LayoutType = 'auto'
    ): ComposedView {
        const id = this.generateViewId();
        const layout = this.inferLayout(components, layoutType);

        const view: ComposedView = {
            id,
            layer,
            components,
            layout,
            timestamp: Date.now(),
        };

        this.views.set(id, view);
        return view;
    }

    /**
     * Apply theme and deployment config to a view
     */
    applyTheme(view: ComposedView, config: DeploymentConfig): ThemedView {
        const styleOverrides: Record<string, string> = {};

        // Apply density settings
        const density = config.design_principles?.density;
        if (density) {
            styleOverrides['--density'] = density;

            // Adjust spacing based on density
            const spacingMultiplier = density === 'compact' ? 0.75 : density === 'spacious' ? 1.25 : 1;
            const baseUnit = config.brand.theme.spacing?.base_unit || 8;
            styleOverrides['--component-spacing'] = `${baseUnit * spacingMultiplier}px`;
        }

        // Apply animation preferences
        const animations = config.design_principles?.animations;
        if (animations === 'none') {
            styleOverrides['--transition-duration'] = '0ms';
        } else if (animations === 'reduced') {
            styleOverrides['--transition-duration'] = '100ms';
        } else if (animations === 'smooth') {
            styleOverrides['--transition-duration'] = '200ms';
        } else if (animations === 'playful') {
            styleOverrides['--transition-duration'] = '300ms';
        }

        // Apply effects
        const effects = config.design_principles?.effects;
        if (effects?.glassmorphism) {
            styleOverrides['--glassmorphism'] = 'enabled';
        }
        if (effects?.blur) {
            styleOverrides['--backdrop-blur'] = '10px';
        }

        return {
            ...view,
            styleOverrides,
        };
    }

    /**
     * Render a composed view into a container
     */
    renderView(view: ComposedView | ThemedView, container: HTMLElement): void {
        // Clear container
        container.innerHTML = '';

        // Create layout wrapper
        const layoutWrapper = this.createLayoutWrapper(view.layout);

        // Apply theme overrides if present
        if ('styleOverrides' in view) {
            Object.entries(view.styleOverrides).forEach(([key, value]) => {
                layoutWrapper.style.setProperty(key, value);
            });
        }

        // Render each component
        view.components.forEach((component) => {
            const componentContainer = document.createElement('div');
            componentContainer.className = 'chameleon-component-container';

            const instance = this.registry.render(component, componentContainer);

            if (instance) {
                layoutWrapper.appendChild(componentContainer);
            }
        });

        container.appendChild(layoutWrapper);
    }

    /**
     * Update a specific component in a view
     */
    updateComponent(viewId: string, componentIndex: number, newData: Record<string, any>): void {
        const view = this.views.get(viewId);
        if (!view) {
            console.warn(`View "${viewId}" not found`);
            return;
        }

        const component = view.components[componentIndex];
        if (!component) {
            console.warn(`Component at index ${componentIndex} not found in view "${viewId}"`);
            return;
        }

        // Update component data
        component.data = { ...component.data, ...newData };

        // If component has a stream_id, update the instance
        if (component.stream_id) {
            this.registry.update(component.stream_id, component.data);
        }
    }

    /**
     * Get a view by ID
     */
    getView(viewId: string): ComposedView | null {
        return this.views.get(viewId) || null;
    }

    /**
     * Destroy a view
     */
    destroyView(viewId: string): void {
        const view = this.views.get(viewId);
        if (!view) {
            return;
        }

        // Destroy all component instances
        view.components.forEach((component) => {
            if (component.stream_id) {
                this.registry.destroy(component.stream_id);
            }
        });

        this.views.delete(viewId);
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    private generateViewId(): string {
        return `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private inferLayout(components: ViewContent[], layoutType: LayoutType): LayoutConfig {
        if (layoutType !== 'auto') {
            return this.getLayoutConfig(layoutType);
        }

        // Auto-infer layout based on component types
        const componentTypes = components.map((c) => c.component_name);
        const count = components.length;

        // Single component - no layout needed
        if (count === 1) {
            return { type: 'stack', direction: 'vertical' };
        }

        // Multiple cards - use grid
        if (componentTypes.every((t) => t === 'card')) {
            return {
                type: 'grid',
                columns: count <= 2 ? count : 3,
                gap: '1rem',
            };
        }

        // Form components - stack vertically
        if (componentTypes.includes('form')) {
            return { type: 'stack', direction: 'vertical', gap: '1.5rem' };
        }

        // Charts and tables - stack vertically
        if (componentTypes.some((t) => t === 'chart' || t === 'table')) {
            return { type: 'stack', direction: 'vertical', gap: '2rem' };
        }

        // Default to vertical stack
        return { type: 'stack', direction: 'vertical', gap: '1rem' };
    }

    private getLayoutConfig(layoutType: LayoutType): LayoutConfig {
        switch (layoutType) {
            case 'grid':
                return { type: 'grid', columns: 3, gap: '1rem' };
            case 'stack':
                return { type: 'stack', direction: 'vertical', gap: '1rem' };
            case 'canvas':
                return { type: 'canvas' };
            default:
                return { type: 'stack', direction: 'vertical' };
        }
    }

    private createLayoutWrapper(layout: LayoutConfig): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = `chameleon-layout chameleon-layout-${layout.type}`;

        switch (layout.type) {
            case 'grid':
                wrapper.style.display = 'grid';
                wrapper.style.gridTemplateColumns = `repeat(${layout.columns || 3}, 1fr)`;
                wrapper.style.gap = layout.gap || '1rem';
                break;

            case 'stack':
                wrapper.style.display = 'flex';
                wrapper.style.flexDirection = layout.direction === 'horizontal' ? 'row' : 'column';
                wrapper.style.gap = layout.gap || '1rem';
                break;

            case 'canvas':
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';
                wrapper.style.height = '100%';
                break;
        }

        return wrapper;
    }
}
