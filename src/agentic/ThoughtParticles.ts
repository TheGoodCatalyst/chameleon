/**
 * ThoughtParticles - Particle system representing agent's ideation process
 * 
 * Visualizes agent generating ideas through particle movements
 */

import anime from 'animejs';
import { AgenticAnimation, AgentPhase, ParticleSystem, ParticleConfig } from './AgenticAnimation';

export interface ThoughtParticlesConfig {
    container: HTMLElement;
    particleCount?: number;
    autoStart?: boolean;
}

export type ThoughtMode = 'gather' | 'process' | 'generate' | 'scatter';

// ============================================================================
// ThoughtParticles Component
// ============================================================================

export class ThoughtParticles extends AgenticAnimation {
    private particleSystem: ParticleSystem | null;
    private mode: ThoughtMode;
    private centerX: number;
    private centerY: number;

    constructor(config: ThoughtParticlesConfig) {
        super({
            container: config.container,
            autoStart: config.autoStart ?? true,
            ambientEnabled: true,
        });

        this.particleSystem = null;
        this.mode = 'process';

        const rect = config.container.getBoundingClientRect();
        this.centerX = (rect.width || 400) / 2;
        this.centerY = (rect.height || 300) / 2;
    }

    // ============================================================================
    // Setup & Render
    // ============================================================================

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'thought-particles');
    }

    protected render(): void {
        // Create particle system
        const config: ParticleConfig = {
            count: 30,
            size: 3,
            color: this.getAgentColor(),
            speed: 2000,
            spread: 100,
        };

        this.particleSystem = new ParticleSystem(this.container, config);
    }

    // ============================================================================
    // Animation Overrides
    // ============================================================================

    protected playSpawnAnimation(): void {
        // Particles burst into existence
        if (this.particleSystem) {
            this.particleSystem.animateBurst();
        }

        setTimeout(() => {
            this.setMode('process');
            this.pulse();
        }, 1000);
    }

    protected playIdleAnimation(): void {
        // Gentle orbital motion
        if (this.particleSystem) {
            this.particleSystem.animateOrbit(this.centerX, this.centerY, 80);
        }
    }

    protected onPhaseChange(from: AgentPhase, to: AgentPhase): void {
        // Map phases to particle modes
        const phaseModeMap: Record<AgentPhase, ThoughtMode> = {
            idle: 'process',
            researching: 'gather',
            processing: 'process',
            analyzing: 'process',
            generating: 'generate',
            blocked: 'scatter',
        };

        this.setMode(phaseModeMap[to]);
    }

    // ============================================================================
    // Particle Modes
    // ============================================================================

    setMode(mode: ThoughtMode): void {
        if (this.mode === mode || !this.particleSystem) return;

        this.mode = mode;

        switch (mode) {
            case 'gather':
                this.animateGather();
                break;
            case 'process':
                this.animateProcess();
                break;
            case 'generate':
                this.animateGenerate();
                break;
            case 'scatter':
                this.animateScatter();
                break;
        }
    }

    private animateGather(): void {
        // Particles spiral inward
        if (!this.particleSystem) return;

        this.particleSystem.animateOrbit(this.centerX, this.centerY, 50);
    }

    private animateProcess(): void {
        // Particles orbit at medium distance
        if (!this.particleSystem) return;

        this.particleSystem.animateOrbit(this.centerX, this.centerY, 80);
    }

    private animateGenerate(): void {
        // Particles flow outward
        if (!this.particleSystem) return;

        this.particleSystem.animateFlow({
            count: 30,
            size: 3,
            color: this.getAgentColor(),
            speed: 2000,
            spread: 150,
        });
    }

    private animateScatter(): void {
        // Particles scatter randomly
        if (!this.particleSystem) return;

        this.particleSystem.animateBurst();
    }

    // ============================================================================
    // Cleanup
    // ============================================================================

    destroy(): void {
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }

        super.destroy();
    }
}
