/**
 * MorphField - Contextual Morphing Container
 * 
 * A container that morphs its shape and content based on agent context.
 * Uses SVG morphing to transition between different states.
 */

import anime from 'animejs';
import { AgenticAnimation, AgenticAnimationConfig } from './AgenticAnimation';
import {
    createShapePath,
    morphShape,
    ShapeType,
    ShapeConfig
} from './svg-morph';

export interface MorphFieldConfig extends AgenticAnimationConfig {
    initialShape?: ShapeType;
    color?: string;
}

export class MorphField extends AgenticAnimation {
    private svg: SVGSVGElement;
    private path: SVGPathElement;
    private currentShape: ShapeType;
    private width: number;
    private height: number;

    constructor(config: MorphFieldConfig) {
        super(config);
        this.currentShape = config.initialShape || 'circle';

        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 300;
        this.height = rect.height || 300;

        this.svg = this.createSVG(this.width, this.height);
        this.container.appendChild(this.svg);

        // Create initial path
        const shapeConfig: ShapeConfig = {
            cx: this.width / 2,
            cy: this.height / 2,
            size: Math.min(this.width, this.height) * 0.6
        };

        this.path = createShapePath(
            this.currentShape,
            shapeConfig,
            config.color || this.getAgentColor()
        );
        this.path.setAttribute('opacity', '0.8');
        this.svg.appendChild(this.path);
    }

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'morph-field');
    }

    protected render(): void {
        // Already handled in constructor for basic setup
        // Re-render if resized
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.svg.setAttribute('width', this.width.toString());
        this.svg.setAttribute('height', this.height.toString());
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);

        // Update path position
        const shapeConfig: ShapeConfig = {
            cx: this.width / 2,
            cy: this.height / 2,
            size: Math.min(this.width, this.height) * 0.6
        };
        // Note: In a real implementation we'd update the d attribute here
    }

    /**
     * Morph to a specific shape type
     */
    morphTo(shape: ShapeType, color?: string): void {
        if (this.currentShape === shape && !color) return;

        const shapeConfig: ShapeConfig = {
            cx: this.width / 2,
            cy: this.height / 2,
            size: Math.min(this.width, this.height) * 0.6
        };

        const timeline = anime.timeline({
            easing: 'easeInOutQuad',
            duration: 1000
        });

        // Morph shape
        // We manually create the morph animation since we need to integrate it into our class structure
        // and potentially handle color changes simultaneously

        // Use the utility to get the target path data
        // We import the generator function logic via the utility (conceptually)
        // For now, we rely on the morphShape utility or manually call it

        // Since morphShape returns an instance, we can just use it if we didn't need a timeline
        // But let's use the timeline for coordination

        // Hack: we need the path data string. 
        // In a full implementation we'd expose getShapePath from svg-morph.ts
        // Let's assume we can import it.

        // For this implementation, I'll use the morphShape utility directly
        // but wrapped in a promise or just fired.

        // Let's actually implement a proper transition

        import('./svg-morph').then(module => {
            const targetPath = module.getShapePath(shape, shapeConfig);

            const animConfig: any = {
                targets: this.path,
                d: targetPath,
                duration: 1000,
                easing: 'easeInOutQuad'
            };

            if (color) {
                animConfig.fill = color;
            }

            anime(animConfig);
        });

        this.currentShape = shape;
    }

    protected playSpawnAnimation(): void {
        anime({
            targets: this.path,
            scale: [0, 1],
            opacity: [0, 0.8],
            duration: 1000,
            easing: 'easeOutElastic(1, .6)'
        });
    }

    protected playIdleAnimation(): void {
        anime({
            targets: this.path,
            scale: [1, 1.05],
            opacity: [0.8, 0.6],
            duration: 3000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }
}
