/**
 * Chameleon Renderer - Main client entry point
 */

import { StateStream } from '../protocol/state-stream';
import { ComponentRegistry } from '../core/component-registry';
import { Compositor } from '../core/compositor';
import { DeploymentLoader } from '../core/deployment-loader';
import { HUD } from './hud';
import { registerCoreComponents } from '../components';
import { InteractionEvent } from '../protocol/types';

export interface RendererConfig {
    container: string | HTMLElement;
    mcpServerUrl: string;
    deploymentConfig: string | any;
    transport?: 'sse' | 'websocket';
}

/**
 * Main Chameleon Renderer
 */
export class ChameleonRenderer {
    private container: HTMLElement;
    private stream: StateStream;
    private registry: ComponentRegistry;
    private compositor: Compositor;
    private deploymentLoader: DeploymentLoader;
    private hud: HUD | null = null;

    constructor(config: RendererConfig) {
        // Get container
        if (typeof config.container === 'string') {
            const el = document.querySelector(config.container);
            if (!el) {
                throw new Error(`Container not found: ${config.container}`);
            }
            this.container = el as HTMLElement;
        } else {
            this.container = config.container;
        }

        // Initialize core systems
        this.registry = new ComponentRegistry();
        this.compositor = new Compositor(this.registry);
        this.deploymentLoader = new DeploymentLoader();

        // Register core components
        registerCoreComponents(this.registry);

        // Create state stream
        this.stream = new StateStream({
            transport: config.transport || 'websocket',
            url: config.mcpServerUrl,
        });

        // Load deployment config
        this.initDeployment(config.deploymentConfig);
    }

    /**
     * Initialize deployment configuration
     */
    private async initDeployment(configSource: string | any): Promise<void> {
        try {
            const config = await this.deploymentLoader.load(configSource);

            // Apply brand to DOM
            this.deploymentLoader.applyBrand();

            // Load custom component overrides
            const overrides = config.component_overrides;
            if (overrides) {
                for (const [componentName, override] of Object.entries(overrides)) {
                    try {
                        await this.registry.loadFromModule(componentName, override.module);
                    } catch (error) {
                        console.error(`Failed to load custom component "${componentName}":`, error);
                    }
                }
            }

            console.log('Deployment config loaded:', config.deployment_id);
        } catch (error) {
            console.error('Failed to load deployment config:', error);
            throw error;
        }
    }

    /**
     * Start rendering
     */
    async start(): Promise<void> {
        // Wait for deployment to be ready
        await this.initDeployment(this.deploymentLoader.getConfig());

        // Create HUD
        this.hud = new HUD({
            container: this.container,
            registry: this.registry,
            compositor: this.compositor,
            deployment: this.deploymentLoader.getConfig(),
        });

        // Connect to state stream
        this.stream.on('*', (event) => {
            if (this.hud) {
                this.hud.handleEvent(event);
            }
        });

        this.stream.onError((error) => {
            console.error('Stream error:', error);
        });

        this.stream.connect();

        // Listen for user interactions
        this.setupInteractionHandlers();

        console.log('Chameleon renderer started');
    }

    /**
     * Stop rendering
     */
    stop(): void {
        this.stream.disconnect();
        if (this.hud) {
            this.hud.destroy();
            this.hud = null;
        }
    }

    /**
     * Send interaction to agent
     */
    sendInteraction(componentId: string, eventType: string, payload: any): void {
        const interaction: InteractionEvent = {
            component_id: componentId,
            event_type: eventType as any,
            payload,
            timestamp: Date.now(),
        };

        this.stream.sendInteraction(interaction);
    }

    /**
     * Setup interaction event handlers
     */
    private setupInteractionHandlers(): void {
        // Listen for component actions
        this.container.addEventListener('chameleon:action', (e: Event) => {
            const customEvent = e as CustomEvent;
            const { actionId, props } = customEvent.detail;

            this.sendInteraction('unknown', 'click', {
                action_id: actionId,
                component_data: props,
            });
        });

        // Listen for form submissions
        this.container.addEventListener('chameleon:submit', (e: Event) => {
            const customEvent = e as CustomEvent;
            const { data } = customEvent.detail;

            this.sendInteraction('form', 'submit', data);
        });

        // Listen for blocker actions
        this.container.addEventListener('chameleon:blocker-action', (e: Event) => {
            const customEvent = e as CustomEvent;
            const { actionId } = customEvent.detail;

            this.sendInteraction('blocker', 'click', { action_id: actionId });
        });
    }

    /**
     * Get the component registry (for adding custom components)
     */
    getRegistry(): ComponentRegistry {
        return this.registry;
    }

    /**
     * Get the deployment config
     */
    getDeployment(): any {
        return this.deploymentLoader.getConfig();
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    (window as any).ChameleonRenderer = ChameleonRenderer;
}
