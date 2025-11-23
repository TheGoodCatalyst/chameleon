/**
 * HUD (Heads-Up Display) - Multi-layer UI renderer
 * 
 * Manages three layers: Peripheral, Focus, and Interrupt
 */

import {
    StateStreamEvent,
    ViewContent,
    isStatusEvent,
    isUIDeltaEvent,
    isBlockerEvent,
} from '../protocol/types';
import { ComponentRegistry } from '../core/component-registry';
import { Compositor } from '../core/compositor';
import { DeploymentConfig } from '../core/deployment-loader';

export interface HUDConfig {
    container: HTMLElement;
    registry: ComponentRegistry;
    compositor: Compositor;
    deployment: DeploymentConfig;
}

/**
 * Multi-layer HUD renderer
 */
export class HUD {
    private config: HUDConfig;
    private peripheralLayer: HTMLElement;
    private focusLayer: HTMLElement;
    private interruptLayer: HTMLElement;

    constructor(config: HUDConfig) {
        this.config = config;

        // Create layer structure
        const { peripheralLayer, focusLayer, interruptLayer } = this.createLayers();
        this.peripheralLayer = peripheralLayer;
        this.focusLayer = focusLayer;
        this.interruptLayer = interruptLayer;

        // Append to container
        config.container.appendChild(peripheralLayer);
        config.container.appendChild(focusLayer);
        config.container.appendChild(interruptLayer);
    }

    /**
     * Handle incoming stream events
     */
    handleEvent(event: StateStreamEvent): void {
        const { data } = event;

        if (isStatusEvent(data)) {
            this.updatePeripheral(data);
        } else if (isUIDeltaEvent(data)) {
            if (data.component) {
                this.renderComponent(data.component);
            } else if (data.delta) {
                this.applyDelta(data.delta);
            }
        } else if (isBlockerEvent(data)) {
            this.showBlocker(data);
        }
    }

    /**
     * Update peripheral layer with status
     */
    private updatePeripheral(status: any): void {
        this.peripheralLayer.innerHTML = '';

        const statusBar = document.createElement('div');
        statusBar.className = 'peripheral-status';

        // Phase indicator
        const phase = document.createElement('div');
        phase.className = 'status-phase';
        phase.textContent = status.phase || 'idle';
        statusBar.appendChild(phase);

        // Progress bar
        if (status.progress !== undefined) {
            const progressBar = document.createElement('div');
            progressBar.className = 'status-progress';

            const progressFill = document.createElement('div');
            progressFill.className = 'status-progress-fill';
            progressFill.style.width = `${status.progress}%`;
            progressBar.appendChild(progressFill);

            statusBar.appendChild(progressBar);
        }

        // Message
        if (status.message) {
            const message = document.createElement('div');
            message.className = 'status-message';
            message.textContent = status.message;
            statusBar.appendChild(message);
        }

        this.peripheralLayer.appendChild(statusBar);
    }

    /**
     * Render a component into the appropriate layer
     */
    private renderComponent(component: ViewContent): void {
        const layer = component.layer || 'focus';
        const targetLayer = this.getLayer(layer);

        // Clear if it's a focus layer component
        if (layer === 'focus') {
            targetLayer.innerHTML = '';
        }

        // Use compositor to render
        const view = this.config.compositor.composeView([component], layer);
        const themedView = this.config.compositor.applyTheme(view, this.config.deployment);

        this.config.compositor.renderView(themedView, targetLayer);
    }

    /**
     * Apply a state delta to existing component
     */
    private applyDelta(delta: any): void {
        // Find component instance and update
        this.config.registry.update(delta.target_id, delta.payload);
    }

    /**
     * Show blocker in interrupt layer
     */
    private showBlocker(blocker: any): void {
        this.interruptLayer.innerHTML = '';

        const modal = document.createElement('div');
        modal.className = 'blocker-modal';

        const overlay = document.createElement('div');
        overlay.className = 'blocker-overlay';
        modal.appendChild(overlay);

        const content = document.createElement('div');
        content.className = 'blocker-content';

        const message = document.createElement('p');
        message.className = 'blocker-message';
        message.textContent = blocker.message;
        content.appendChild(message);

        // Actions
        if (blocker.actions && blocker.actions.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'blocker-actions';

            blocker.actions.forEach((action: any) => {
                const button = document.createElement('button');
                button.className = `blocker-action blocker-action-${action.type || 'primary'}`;
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    this.handleBlockerAction(action.id);
                });
                actions.appendChild(button);
            });

            content.appendChild(actions);
        }

        // Render custom component if provided
        if (blocker.component) {
            const componentContainer = document.createElement('div');
            componentContainer.className = 'blocker-component';
            this.config.registry.render(blocker.component, componentContainer);
            content.appendChild(componentContainer);
        }

        modal.appendChild(content);
        this.interruptLayer.appendChild(modal);
    }

    /**
     * Handle blocker action clicks
     */
    private handleBlockerAction(actionId: string): void {
        // Dispatch event for parent to handle
        this.config.container.dispatchEvent(
            new CustomEvent('chameleon:blocker-action', {
                detail: { actionId },
                bubbles: true,
            })
        );

        // Clear interrupt layer
        this.interruptLayer.innerHTML = '';
    }

    /**
     * Get layer element by name
     */
    private getLayer(layerName: string): HTMLElement {
        switch (layerName) {
            case 'peripheral':
                return this.peripheralLayer;
            case 'focus':
                return this.focusLayer;
            case 'interrupt':
                return this.interruptLayer;
            default:
                return this.focusLayer;
        }
    }

    /**
     * Create layer structure
     */
    private createLayers(): {
        peripheralLayer: HTMLElement;
        focusLayer: HTMLElement;
        interruptLayer: HTMLElement;
    } {
        const peripheralLayer = document.createElement('div');
        peripheralLayer.className = 'chameleon-layer chameleon-layer-peripheral';

        const focusLayer = document.createElement('div');
        focusLayer.className = 'chameleon-layer chameleon-layer-focus';

        const interruptLayer = document.createElement('div');
        interruptLayer.className = 'chameleon-layer chameleon-layer-interrupt';

        return { peripheralLayer, focusLayer, interruptLayer };
    }

    /**
     * Clear all layers
     */
    clear(): void {
        this.peripheralLayer.innerHTML = '';
        this.focusLayer.innerHTML = '';
        this.interruptLayer.innerHTML = '';
    }

    /**
     * Destroy HUD
     */
    destroy(): void {
        this.config.registry.destroyAll();
        this.config.container.innerHTML = '';
    }
}
