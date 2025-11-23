/**
 * Component Registry - Dynamic component loading and management
 */

import { ViewContent } from '../protocol/types';

// ============================================================================
// Component Definition Types
// ============================================================================

export type ComponentProps = Record<string, any>;

export interface ComponentDefinition {
    name: string;
    render: (props: ComponentProps, container: HTMLElement) => ComponentInstance;
    schema?: Record<string, any>; // JSON Schema for validation
}

export interface ComponentInstance {
    element: HTMLElement;
    update?: (props: ComponentProps) => void;
    destroy?: () => void;
}

export type ComponentFactory = (props: ComponentProps, container: HTMLElement) => ComponentInstance;

// ============================================================================
// Component Registry Class
// ============================================================================

export class ComponentRegistry {
    private components: Map<string, ComponentDefinition>;
    private instances: Map<string, ComponentInstance>;

    constructor() {
        this.components = new Map();
        this.instances = new Map();
    }

    /**
     * Register a component
     */
    register(definition: ComponentDefinition): void {
        if (this.components.has(definition.name)) {
            console.warn(`Component "${definition.name}" is already registered. Overwriting.`);
        }
        this.components.set(definition.name, definition);
    }

    /**
     * Register multiple components at once
     */
    registerBatch(definitions: ComponentDefinition[]): void {
        definitions.forEach((def) => this.register(def));
    }

    /**
     * Get a component definition
     */
    get(name: string): ComponentDefinition | null {
        return this.components.get(name) || null;
    }

    /**
     * Check if a component is registered
     */
    has(name: string): boolean {
        return this.components.has(name);
    }

    /**
     * Override an existing component
     */
    override(name: string, definition: ComponentDefinition): void {
        if (!this.components.has(name)) {
            console.warn(`Component "${name}" does not exist. Registering as new.`);
        }
        this.components.set(name, definition);
    }

    /**
     * Load custom component from ES module
     */
    async loadFromModule(name: string, modulePath: string): Promise<void> {
        try {
            const module = await import(modulePath);

            if (!module.default && !module[name]) {
                throw new Error(`Module "${modulePath}" does not export "${name}" or default`);
            }

            const componentDef = module.default || module[name];

            if (typeof componentDef.render !== 'function') {
                throw new Error(`Component "${name}" must have a render function`);
            }

            this.register({
                name,
                ...componentDef,
            });
        } catch (error) {
            console.error(`Failed to load component from module "${modulePath}":`, error);
            throw error;
        }
    }

    /**
     * Render a component
     */
    render(viewContent: ViewContent, container: HTMLElement): ComponentInstance | null {
        const definition = this.get(viewContent.component_name);

        if (!definition) {
            console.error(`Component "${viewContent.component_name}" not found in registry`);
            return null;
        }

        try {
            const instance = definition.render(viewContent.data, container);

            // Store instance for later updates
            if (viewContent.stream_id) {
                this.instances.set(viewContent.stream_id, instance);
            }

            return instance;
        } catch (error) {
            console.error(`Failed to render component "${viewContent.component_name}":`, error);
            throw error;
        }
    }

    /**
     * Update an existing component instance
     */
    update(instanceId: string, props: ComponentProps): void {
        const instance = this.instances.get(instanceId);

        if (!instance) {
            console.warn(`Component instance "${instanceId}" not found`);
            return;
        }

        if (instance.update) {
            instance.update(props);
        } else {
            console.warn(`Component instance "${instanceId}" does not support updates`);
        }
    }

    /**
     * Destroy a component instance
     */
    destroy(instanceId: string): void {
        const instance = this.instances.get(instanceId);

        if (!instance) {
            return;
        }

        if (instance.destroy) {
            instance.destroy();
        }

        // Remove from DOM
        if (instance.element.parentNode) {
            instance.element.parentNode.removeChild(instance.element);
        }

        this.instances.delete(instanceId);
    }

    /**
     * Destroy all component instances
     */
    destroyAll(): void {
        this.instances.forEach((_, id) => this.destroy(id));
    }

    /**
     * List all registered component names
     */
    listComponents(): string[] {
        return Array.from(this.components.keys());
    }

    /**
     * Validate component data against schema
     */
    validate(componentName: string, data: ComponentProps): boolean {
        const definition = this.get(componentName);

        if (!definition || !definition.schema) {
            // No schema, assume valid
            return true;
        }

        // TODO: Implement JSON Schema validation
        // For now, just return true
        return true;
    }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

export const globalRegistry = new ComponentRegistry();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a simple component definition from a render function
 */
export function defineComponent(
    name: string,
    render: ComponentFactory,
    schema?: Record<string, any>
): ComponentDefinition {
    return { name, render, schema };
}

/**
 * Create a component wrapper element
 */
export function createComponentWrapper(componentName: string, instanceId?: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = `chameleon-component chameleon-${componentName}`;

    if (instanceId) {
        wrapper.setAttribute('data-instance-id', instanceId);
    }

    return wrapper;
}
