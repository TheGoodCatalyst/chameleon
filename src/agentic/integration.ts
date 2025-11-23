/**
 * Agentic Integration Helper
 * 
 * Utilities to bind StateStream events to Agentic Animations
 */

import { StateStream } from '../protocol/types'; // Assuming types are exported here or similar
import { AgenticAnimation, AgentPhase } from './AgenticAnimation';

export class AgenticBinder {
    private animations: AgenticAnimation[];
    private stream: any; // Using any for now as StateStream type import might need adjustment

    constructor(stream: any) {
        this.stream = stream;
        this.animations = [];

        this.setupListeners();
    }

    register(animation: AgenticAnimation): void {
        this.animations.push(animation);
    }

    private setupListeners(): void {
        if (!this.stream) return;

        // Listen for status updates
        // Assuming stream emits 'status' events
        // Note: Actual implementation depends on StateStream event names
        // Based on previous files, it seems we might need to subscribe

        // Example binding logic
        /*
        this.stream.on('status', (event: any) => {
          const phase = event.data?.phase as AgentPhase;
          if (phase) {
            this.animations.forEach(anim => anim.setAgentPhase(phase));
          }
        });
    
        this.stream.on('ui_delta', (event: any) => {
          this.animations.forEach(anim => anim.syncState(event.data));
        });
        */
    }

    /**
     * Manual binding for demo purposes or simple integration
     */
    bindPhase(phase: AgentPhase): void {
        this.animations.forEach(anim => anim.setAgentPhase(phase));
    }

    bindEvent(event: string, data?: any): void {
        this.animations.forEach(anim => anim.react(event, data));
    }
}
