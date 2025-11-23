/**
 * GravityWell - Decision Visualization
 * 
 * Visualizes options as planets orbiting a central gravity well (the agent).
 * Physics-based interaction where options are pulled in or rejected.
 */

import anime from 'animejs';
import { AgenticAnimation, AgenticAnimationConfig } from './AgenticAnimation';

export interface GravityWellConfig extends AgenticAnimationConfig {
    options?: string[];
}

interface OptionNode {
    id: string;
    label: string;
    element: SVGGElement;
    circle: SVGCircleElement;
    text: SVGTextElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    radius: number;
}

export class GravityWell extends AgenticAnimation {
    private svg: SVGSVGElement;
    private centerNode: SVGCircleElement;
    private options: OptionNode[];
    private animationFrame: number | null;
    private width: number;
    private height: number;
    private centerX: number;
    private centerY: number;

    constructor(config: GravityWellConfig) {
        super(config);
        this.options = [];
        this.animationFrame = null;

        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 400;
        this.height = rect.height || 400;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.svg = this.createSVG(this.width, this.height);
        this.container.appendChild(this.svg);

        // Create center gravity well (Agent)
        this.centerNode = this.createCircle(this.centerX, this.centerY, 30, this.getAgentColor());
        this.centerNode.setAttribute('filter', 'url(#glow)');
        this.centerNode.setAttribute('opacity', '0.8');

        // Add glow filter
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'glow');
        filter.innerHTML = `
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
        defs.appendChild(filter);
        this.svg.appendChild(defs);
        this.svg.appendChild(this.centerNode);

        if (config.options) {
            this.addOptions(config.options);
        }
    }

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'gravity-well');
    }

    protected render(): void {
        // Physics loop
        this.startPhysics();
    }

    addOptions(labels: string[]): void {
        labels.forEach((label, i) => {
            const angle = (i / labels.length) * Math.PI * 2;
            const distance = 120;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            const circle = this.createCircle(0, 0, 15, '#a78bfa');
            circle.setAttribute('opacity', '0.9');
            circle.style.cursor = 'pointer';

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.textContent = label;
            text.setAttribute('y', '25');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '12');
            text.style.pointerEvents = 'none';

            group.appendChild(circle);
            group.appendChild(text);
            group.setAttribute('transform', `translate(${x}, ${y})`);

            this.svg.appendChild(group);

            this.options.push({
                id: `opt-${i}`,
                label,
                element: group,
                circle,
                text,
                x,
                y,
                vx: -Math.sin(angle) * 0.5, // Initial orbital velocity
                vy: Math.cos(angle) * 0.5,
                mass: 1,
                radius: 15
            });

            // Add interactions
            group.addEventListener('mouseenter', () => {
                anime({ targets: circle, r: 20, duration: 200 });
            });
            group.addEventListener('mouseleave', () => {
                anime({ targets: circle, r: 15, duration: 200 });
            });
        });
    }

    private startPhysics(): void {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        const update = () => {
            if (this.destroyed) return;

            this.options.forEach(opt => {
                // Gravity toward center
                const dx = this.centerX - opt.x;
                const dy = this.centerY - opt.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 10) {
                    const force = 500 / (dist * dist); // Inverse square law
                    const ax = (dx / dist) * force;
                    const ay = (dy / dist) * force;

                    opt.vx += ax;
                    opt.vy += ay;
                }

                // Update position
                opt.x += opt.vx;
                opt.y += opt.vy;

                // Update DOM
                opt.element.setAttribute('transform', `translate(${opt.x}, ${opt.y})`);
            });

            this.animationFrame = requestAnimationFrame(update);
        };

        this.animationFrame = requestAnimationFrame(update);
    }

    protected playSpawnAnimation(): void {
        anime({
            targets: this.centerNode,
            r: [0, 30],
            opacity: [0, 0.8],
            duration: 1000,
            easing: 'easeOutElastic(1, .6)'
        });
    }

    protected playIdleAnimation(): void {
        anime({
            targets: this.centerNode,
            r: [30, 35],
            opacity: [0.8, 0.6],
            duration: 2000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    destroy(): void {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        super.destroy();
    }
}
