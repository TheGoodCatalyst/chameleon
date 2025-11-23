/**
 * Component Registry Index - Register all core components
 */

import { ComponentRegistry } from '../core/component-registry';
import { CardComponent } from './Card';
import { ChartComponent } from './Chart';
import { FormComponent } from './Form';

/**
 * Register all core components with a registry
 */
export function registerCoreComponents(registry: ComponentRegistry): void {
    registry.register(CardComponent);
    registry.register(ChartComponent);
    registry.register(FormComponent);
}

/**
 * Re-export components for direct use
 */
export { CardComponent, ChartComponent, FormComponent };
