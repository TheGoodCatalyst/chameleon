/**
 * Chameleon Framework - Main Entry Point
 * 
 * Export all public APIs
 */

// Protocol Types
export * from './protocol/types';
export { StateStream, applyDelta } from './protocol/state-stream';

// Core Systems
export { ComponentRegistry, defineComponent, createComponentWrapper } from './core/component-registry';
export { Compositor } from './core/compositor';
export { DeploymentLoader } from './core/deployment-loader';

// Client
export { ChameleonRenderer } from './client/renderer';
export { HUD } from './client/hud';

// Components
export { registerCoreComponents, CardComponent, ChartComponent, FormComponent } from './components';

// Type exports
export type {
    ComponentDefinition,
    ComponentInstance,
    ComponentProps,
} from './core/component-registry';

export type {
    DeploymentConfig,
    BrandConfig,
    ThemeConfig,
    DesignPrinciples,
    InteractionMechanisms,
} from './core/deployment-loader';

export type {
    RendererConfig,
} from './client/renderer';
