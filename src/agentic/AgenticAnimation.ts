/**
 * Agentic Animation Engine - Base Class
 * 
 * Foundation for all agentic visual interactions using Anime.js
 */

import anime, { AnimeInstance, AnimeTimelineInstance } from 'animejs';
import { StateDelta } from '../protocol/types';

// ============================================================================
// Animation States
// ============================================================================

export type AnimationState =
    | 'spawning'    // Birth animation
    | 'idle'        // Breathing/ambient
    | 'active'      // Processing/thinking
    | 'reacting'    // Responding to event
    | 'morphing'    // Transitioning
    | 'collapsing'; // Death animation

export type AgentPhase =
    | 'idle'
    | 'researching'
    | 'processing'
    | 'analyzing'
    | 'generating'
    | 'blocked';

// ============================================================================
// Animation Configuration
// ============================================================================

export interface AgenticAnimationConfig {
    container: HTMLElement;
    autoStart?: boolean;
    ambientEnabled?: boolean;
    responsive?: boolean;
}

export interface ParticleConfig {
    count: number;
    size: number;
    color: string;
    speed: number;
    spread: number;
}

// ============================================================================
// Base Class
// ============================================================================

export abstract class AgenticAnimation {
    protected container: HTMLElement;
    protected state: AnimationState;
    protected agentPhase: AgentPhase;
    protected timeline: AnimeTimelineInstance | null;
    protected animations: Map<string, AnimeInstance>;
    protected config: AgenticAnimationConfig;
    protected destroyed: boolean;

    constructor(config: AgenticAnimationConfig) {
        this.container = config.container;
        this.config = {
            autoStart: true,
            ambientEnabled: true,
            responsive: true,
            ...config,
        };

        this.state = 'spawning';
        this.agentPhase = 'idle';
        this.timeline = null;
        this.animations = new Map();
        this.destroyed = false;

        // Setup
        this.setup();

        if (this.config.autoStart) {
            this.spawn();
        }

        // Responsive handling
        if (this.config.responsive) {
            this.setupResponsive();
        }
    }

    // ============================================================================
    // Abstract Methods (Must Implement)
    // ============================================================================

    /**
     * Setup the component structure
     */
    protected abstract setup(): void;

    /**
     * Render the initial state
     */
    protected abstract render(): void;

    // ============================================================================
    // Lifecycle Methods
    // ============================================================================

    /**
     * Spawn animation - component birth
     */
    spawn(): void {
        this.state = 'spawning';
        this.render();
        this.playSpawnAnimation();
    }

    /**
     * Start breathing/idle animation
     */
    pulse(): void {
        if (!this.config.ambientEnabled) return;

        this.state = 'idle';
        this.playIdleAnimation();
    }

    /**
     * React to agent event
     */
    react(event: string, data?: any): void {
        this.state = 'reacting';
        this.playReactionAnimation(event, data);
    }

    /**
     * Morph to new state/shape
     */
    morph(targetState: any): void {
        this.state = 'morphing';
        this.playMorphAnimation(targetState);
    }

    /**
     * Collapse/death animation
     */
    collapse(): void {
        this.state = 'collapsing';
        this.playCollapseAnimation();
    }

    /**
     * Sync with agent state
     */
    syncState(delta: StateDelta): void {
        // Override in subclasses to handle specific state changes
        this.updateFromDelta(delta);
    }

    /**
     * Set agent phase
     */
    setAgentPhase(phase: AgentPhase): void {
        if (this.agentPhase === phase) return;

        const previousPhase = this.agentPhase;
        this.agentPhase = phase;
        this.onPhaseChange(previousPhase, phase);
    }

    /**
     * Destroy and cleanup
     */
    destroy(): void {
        this.destroyed = true;

        // Stop all animations
        this.animations.forEach((anim) => {
            anim.pause();
        });

        if (this.timeline) {
            this.timeline.pause();
        }

        this.animations.clear();
        this.container.innerHTML = '';
    }

    // ============================================================================
    // Animation Playback Methods
    // ============================================================================

    protected playSpawnAnimation(): void {
        // Default spawn: fade in with scale
        const elements = this.container.querySelectorAll('[data-animate]');

        this.addAnimation('spawn', anime({
            targets: Array.from(elements),
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .6)',
            complete: () => {
                this.pulse();
            }
        }));
    }

    protected playIdleAnimation(): void {
        // Default idle: subtle breathing
        const elements = this.container.querySelectorAll('[data-breathe]');

        this.addAnimation('idle', anime({
            targets: Array.from(elements),
            scale: [1, 1.02],
            opacity: [0.9, 1],
            duration: 3000,
            easing: 'easeInOutSine',
            loop: true,
            direction: 'alternate'
        }));
    }

    protected playReactionAnimation(event: string, data?: any): void {
        // Override in subclasses for specific reactions
    }

    protected playMorphAnimation(targetState: any): void {
        // Override in subclasses for morphing
    }

    protected playCollapseAnimation(): void {
        // Default collapse: scale down with fade
        const elements = this.container.querySelectorAll('[data-animate]');

        this.addAnimation('collapse', anime({
            targets: Array.from(elements),
            opacity: [1, 0],
            scale: [1, 0.5],
            duration: 600,
            easing: 'easeInBack',
            complete: () => {
                this.destroy();
            }
        }));
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    protected addAnimation(name: string, animation: AnimeInstance): void {
        // Stop previous animation with same name
        if (this.animations.has(name)) {
            this.animations.get(name)!.pause();
        }

        this.animations.set(name, animation);
    }

    protected createTimeline(): AnimeTimelineInstance {
        this.timeline = anime.timeline({
            autoplay: false,
        });

        return this.timeline;
    }

    protected updateFromDelta(delta: StateDelta): void {
        // Default implementation - override for specific behavior
    }

    protected onPhaseChange(from: AgentPhase, to: AgentPhase): void {
        // Override in subclasses to react to phase changes
    }

    protected setupResponsive(): void {
        const resizeObserver = new ResizeObserver(() => {
            if (!this.destroyed) {
                this.render();
            }
        });

        resizeObserver.observe(this.container);
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    protected createSVG(width: number, height: number): SVGSVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        return svg;
    }

    protected createCircle(cx: number, cy: number, r: number, color: string): SVGCircleElement {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        circle.setAttribute('r', r.toString());
        circle.setAttribute('fill', color);
        return circle;
    }

    protected createPath(d: string, stroke: string, strokeWidth: number = 2): SVGPathElement {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', strokeWidth.toString());
        path.setAttribute('fill', 'none');
        return path;
    }

    protected randomInRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    protected getAgentColor(): string {
        // Colors based on agent phase
        const colors: Record<AgentPhase, string> = {
            idle: '#64748b',
            researching: '#3b82f6',
            processing: '#8b5cf6',
            analyzing: '#ec4899',
            generating: '#10b981',
            blocked: '#f59e0b',
        };

        return colors[this.agentPhase];
    }

    // ============================================================================
    // Getters
    // ============================================================================

    getState(): AnimationState {
        return this.state;
    }

    getAgentPhase(): AgentPhase {
        return this.agentPhase;
    }

    isDestroyed(): boolean {
        return this.destroyed;
    }
}

// ============================================================================
// Particle System Utilities
// ============================================================================

export class ParticleSystem {
    private particles: Particle[];
    private container: HTMLElement;
    private svg: SVGSVGElement;

    constructor(container: HTMLElement, config: ParticleConfig) {
        this.container = container;
        this.particles = [];

        // Create SVG
        const rect = container.getBoundingClientRect();
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', rect.width.toString());
        this.svg.setAttribute('height', rect.height.toString());
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.pointerEvents = 'none';

        container.appendChild(this.svg);

        // Create particles
        this.spawn(config);
    }

    spawn(config: ParticleConfig): void {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        for (let i = 0; i < config.count; i++) {
            const particle = new Particle(
                centerX,
                centerY,
                config.size,
                config.color,
                this.svg
            );

            this.particles.push(particle);
        }
    }

    animateFlow(config: ParticleConfig): void {
        this.particles.forEach((particle, i) => {
            particle.flow(config.speed, config.spread, i * 50);
        });
    }

    animateOrbit(centerX: number, centerY: number, radius: number): void {
        this.particles.forEach((particle, i) => {
            particle.orbit(centerX, centerY, radius, i);
        });
    }

    animateBurst(): void {
        this.particles.forEach((particle) => {
            particle.burst();
        });
    }

    destroy(): void {
        this.particles.forEach((p) => p.destroy());
        this.particles = [];
        if (this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
    }
}

class Particle {
    private element: SVGCircleElement;
    private x: number;
    private y: number;
    private animation: AnimeInstance | null;

    constructor(x: number, y: number, size: number, color: string, parent: SVGSVGElement) {
        this.x = x;
        this.y = y;
        this.animation = null;

        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.element.setAttribute('cx', x.toString());
        this.element.setAttribute('cy', y.toString());
        this.element.setAttribute('r', size.toString());
        this.element.setAttribute('fill', color);
        this.element.setAttribute('opacity', '0.7');

        parent.appendChild(this.element);
    }

    flow(speed: number, spread: number, delay: number): void {
        this.animation = anime({
            targets: this.element,
            cx: () => anime.random(this.x - spread, this.x + spread),
            cy: () => anime.random(this.y - spread, this.y + spread),
            duration: speed,
            delay,
            easing: 'easeInOutQuad',
            loop: true
        });
    }

    orbit(cx: number, cy: number, radius: number, index: number): void {
        const angle = (index / 10) * Math.PI * 2;

        this.animation = anime({
            targets: this.element,
            cx: cx + Math.cos(angle) * radius,
            cy: cy + Math.sin(angle) * radius,
            duration: 2000,
            easing: 'linear',
            loop: true
        });
    }

    burst(): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = anime.random(100, 300);

        this.animation = anime({
            targets: this.element,
            cx: this.x + Math.cos(angle) * distance,
            cy: this.y + Math.sin(angle) * distance,
            opacity: [0.7, 0],
            duration: 1000,
            easing: 'easeOutQuad'
        });
    }

    destroy(): void {
        if (this.animation) {
            this.animation.pause();
        }
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
