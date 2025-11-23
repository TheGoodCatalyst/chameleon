/**
 * EnergyRiver - Processing Flow Visualization
 * 
 * Visualizes data or processing throughput as a flowing river of particles.
 * Supports branching and variable flow rates.
 */

import anime from 'animejs';
import { AgenticAnimation, AgenticAnimationConfig } from './AgenticAnimation';

export interface EnergyRiverConfig extends AgenticAnimationConfig {
    flowRate?: number; // Particles per second
    branches?: number;
}

interface StreamParticle {
    element: SVGCircleElement;
    path: SVGPathElement;
    progress: number;
    speed: number;
}

export class EnergyRiver extends AgenticAnimation {
    private svg: SVGSVGElement;
    private paths: SVGPathElement[];
    private particles: StreamParticle[];
    private width: number;
    private height: number;
    private isFlowing: boolean;

    constructor(config: EnergyRiverConfig) {
        super(config);
        this.particles = [];
        this.paths = [];
        this.isFlowing = true;

        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 600;
        this.height = rect.height || 200;

        this.svg = this.createSVG(this.width, this.height);
        this.container.appendChild(this.svg);

        this.createPaths(config.branches || 1);
    }

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'energy-river');
    }

    protected render(): void {
        this.startFlow();
    }

    private createPaths(branches: number): void {
        // Main trunk
        const startY = this.height / 2;

        for (let i = 0; i < branches; i++) {
            const endY = (this.height / (branches + 1)) * (i + 1);
            const cp1x = this.width * 0.3;
            const cp1y = startY;
            const cp2x = this.width * 0.7;
            const cp2y = endY;

            const d = `M 0,${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${this.width},${endY}`;

            const path = this.createPath(d, this.getAgentColor(), 2);
            path.setAttribute('opacity', '0.2');
            this.svg.appendChild(path);
            this.paths.push(path);
        }
    }

    private startFlow(): void {
        const spawnParticle = () => {
            if (!this.isFlowing || this.destroyed) return;

            // Pick random path
            const pathIndex = Math.floor(Math.random() * this.paths.length);
            const path = this.paths[pathIndex];

            const particle = this.createCircle(0, 0, 3, this.getAgentColor());
            particle.setAttribute('opacity', '0.8');
            this.svg.appendChild(particle);

            // Animate along path
            const pathEl = anime.path(path);

            anime({
                targets: particle,
                translateX: pathEl('x'),
                translateY: pathEl('y'),
                easing: 'linear',
                duration: anime.random(1000, 2000),
                complete: () => {
                    particle.remove();
                }
            });

            // Schedule next spawn
            setTimeout(spawnParticle, 100);
        };

        spawnParticle();
    }

    protected playSpawnAnimation(): void {
        anime({
            targets: this.paths,
            strokeDashoffset: [anime.setDashoffset, 0],
            opacity: [0, 0.2],
            duration: 1500,
            easing: 'easeInOutQuad'
        });
    }

    protected playIdleAnimation(): void {
        // Pulse path width
        anime({
            targets: this.paths,
            strokeWidth: [2, 3],
            duration: 2000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    destroy(): void {
        this.isFlowing = false;
        super.destroy();
    }
}
