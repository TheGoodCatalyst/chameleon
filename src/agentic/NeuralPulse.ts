/**
 * NeuralPulse - Neural network visualization showing agent's brain activity
 * 
 * Visualizes agent thought processes as a network of nodes with flowing pulses
 */

import anime from 'animejs';
import { AgenticAnimation, AgentPhase, AnimationState } from './AgenticAnimation';
import { StateDelta } from '../protocol/types';

// ============================================================================
// Types
// ============================================================================

interface NetworkNode {
    id: string;
    x: number;
    y: number;
    radius: number;
    element: SVGCircleElement;
    label: string;
    active: boolean;
}

interface NetworkEdge {
    from: string;
    to: string;
    element: SVGPathElement;
    pulses: SVGCircleElement[];
}

export interface NeuralPulseConfig {
    container: HTMLElement;
    nodeCount?: number;
    autoStart?: boolean;
    showLabels?: boolean;
}

// ============================================================================
// NeuralPulse Component
// ============================================================================

export class NeuralPulse extends AgenticAnimation {
    private svg: SVGSVGElement;
    private nodes: Map<string, NetworkNode>;
    private edges: NetworkEdge[];
    private width: number;
    private height: number;
    private showLabels: boolean;
    private pulseInterval: number | null;

    constructor(config: NeuralPulseConfig) {
        super({
            container: config.container,
            autoStart: config.autoStart ?? true,
            ambientEnabled: true,
        });

        this.nodes = new Map();
        this.edges = [];
        this.pulseInterval = null;
        this.showLabels = config.showLabels ?? true;

        const rect = config.container.getBoundingClientRect();
        this.width = rect.width || 600;
        this.height = rect.height || 400;

        this.svg = this.createSVG(this.width, this.height);
        this.container.appendChild(this.svg);
    }

    // ============================================================================
    // Setup & Render
    // ============================================================================

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'neural-pulse');
    }

    protected render(): void {
        // Clear existing
        this.svg.innerHTML = '';
        this.nodes.clear();
        this.edges = [];

        // Create network structure
        this.createNodes();
        this.createEdges();
    }

    private createNodes(): void {
        // Node definitions (representing agent processes)
        const nodeData = [
            { id: 'input', label: 'Input', x: 0.2, y: 0.5 },
            { id: 'perceive', label: 'Perceive', x: 0.35, y: 0.3 },
            { id: 'analyze', label: 'Analyze', x: 0.5, y: 0.5 },
            { id: 'reason', label: 'Reason', x: 0.35, y: 0.7 },
            { id: 'decide', label: 'Decide', x: 0.65, y: 0.5 },
            { id: 'generate', label: 'Generate', x: 0.8, y: 0.3 },
            { id: 'output', label: 'Output', x: 0.8, y: 0.7 },
        ];

        nodeData.forEach((data) => {
            const x = data.x * this.width;
            const y = data.y * this.height;
            const radius = 20;

            // Create node circle
            const circle = this.createCircle(x, y, radius, this.getAgentColor());
            circle.setAttribute('data-animate', 'true');
            circle.setAttribute('data-breathe', 'true');
            circle.setAttribute('data-node-id', data.id);
            circle.style.filter = 'drop-shadow(0 0 8px currentColor)';
            circle.style.opacity = '0.7';
            circle.style.cursor = 'pointer';

            this.svg.appendChild(circle);

            // Create label if enabled
            if (this.showLabels) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x.toString());
                text.setAttribute('y', (y + radius + 15).toString());
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', 'currentColor');
                text.setAttribute('font-size', '12');
                text.setAttribute('opacity', '0.7');
                text.textContent = data.label;
                this.svg.appendChild(text);
            }

            // Store node
            this.nodes.set(data.id, {
                id: data.id,
                x,
                y,
                radius,
                element: circle,
                label: data.label,
                active: false,
            });

            // Add hover interaction
            circle.addEventListener('mouseenter', () => this.highlightNode(data.id));
            circle.addEventListener('mouseleave', () => this.unhighlightNode(data.id));
        });
    }

    private createEdges(): void {
        // Edge connections
        const connections = [
            ['input', 'perceive'],
            ['input', 'reason'],
            ['perceive', 'analyze'],
            ['reason', 'analyze'],
            ['analyze', 'decide'],
            ['decide', 'generate'],
            ['decide', 'output'],
        ];

        connections.forEach(([from, to]) => {
            const fromNode = this.nodes.get(from);
            const toNode = this.nodes.get(to);

            if (!fromNode || !toNode) return;

            // Create path
            const pathData = `M ${fromNode.x} ${fromNode.y} Q ${(fromNode.x + toNode.x) / 2
                } ${(fromNode.y + toNode.y) / 2 - 30} ${toNode.x} ${toNode.y}`;

            const path = this.createPath(pathData, this.getAgentColor(), 2);
            path.setAttribute('opacity', '0.3');
            path.setAttribute('data-animate', 'true');
            this.svg.insertBefore(path, this.svg.firstChild); // Insert at bottom

            this.edges.push({
                from,
                to,
                element: path,
                pulses: [],
            });
        });
    }

    // ============================================================================
    // Animation Overrides
    // ============================================================================

    protected playSpawnAnimation(): void {
        // Nodes appear with stagger
        const nodeElements = Array.from(this.nodes.values()).map((n) => n.element);

        this.addAnimation(
            'spawn-nodes',
            anime({
                targets: nodeElements,
                opacity: [0, 0.7],
                scale: [0, 1],
                duration: 1000,
                delay: anime.stagger(100),
                easing: 'easeOutElastic(1, .6)',
            })
        );

        // Edges draw in
        this.addAnimation(
            'spawn-edges',
            anime({
                targets: this.edges.map((e) => e.element),
                strokeDashoffset: [anime.setDashoffset, 0],
                opacity: [0, 0.3],
                duration: 1500,
                delay: 500,
                easing: 'easeInOutQuad',
                complete: () => {
                    this.pulse();
                    this.startPulseFlow();
                },
            })
        );
    }

    protected playIdleAnimation(): void {
        // Gentle breathing of all nodes
        const nodeElements = Array.from(this.nodes.values()).map((n) => n.element);

        this.addAnimation(
            'idle-breathe',
            anime({
                targets: nodeElements,
                scale: [1, 1.1],
                opacity: [0.7, 0.9],
                duration: 3000,
                easing: 'easeInOutSine',
                loop: true,
                direction: 'alternate',
            })
        );
    }

    protected playReactionAnimation(event: string, data?: any): void {
        // Pulse through the network based on event
        if (event === 'thinking') {
            this.activateNode('analyze');
        } else if (event === 'generating') {
            this.activateNode('generate');
        } else if (event === 'deciding') {
            this.activateNode('decide');
        }
    }

    protected onPhaseChange(from: AgentPhase, to: AgentPhase): void {
        // Map agent phases to node activations
        const phaseNodeMap: Record<AgentPhase, string[]> = {
            idle: [],
            researching: ['input', 'perceive'],
            processing: ['analyze'],
            analyzing: ['analyze', 'reason'],
            generating: ['decide', 'generate', 'output'],
            blocked: ['decide'],
        };

        // Deactivate all nodes
        this.nodes.forEach((node) => {
            this.deactivateNode(node.id);
        });

        // Activate nodes for new phase
        const activeNodes = phaseNodeMap[to] || [];
        activeNodes.forEach((nodeId) => {
            this.activateNode(nodeId);
        });

        // Update colors
        this.updateColors();
    }

    // ============================================================================
    // Node Activation
    // ============================================================================

    private activateNode(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node || node.active) return;

        node.active = true;

        // Pulse animation
        anime({
            targets: node.element,
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.9],
            duration: 600,
            easing: 'easeOutElastic(1, .5)',
        });

        // Glow effect
        node.element.style.filter = 'drop-shadow(0 0 15px currentColor)';
    }

    private deactivateNode(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node || !node.active) return;

        node.active = false;

        anime({
            targets: node.element,
            scale: 1,
            opacity: 0.7,
            duration: 400,
            easing: 'easeOutQuad',
        });

        node.element.style.filter = 'drop-shadow(0 0 8px currentColor)';
    }

    private highlightNode(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        anime({
            targets: node.element,
            scale: 1.2,
            opacity: 1,
            duration: 200,
            easing: 'easeOutQuad',
        });
    }

    private unhighlightNode(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        anime({
            targets: node.element,
            scale: node.active ? 1.1 : 1,
            opacity: node.active ? 0.9 : 0.7,
            duration: 200,
            easing: 'easeOutQuad',
        });
    }

    // ============================================================================
    // Pulse Flow
    // ============================================================================

    private startPulseFlow(): void {
        // Send pulses along edges periodically
        const sendPulse = () => {
            if (this.destroyed) return;

            // Pick random edge with active source node
            const activeEdges = this.edges.filter((edge) => {
                const fromNode = this.nodes.get(edge.from);
                return fromNode?.active;
            });

            if (activeEdges.length > 0) {
                const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
                this.createPulse(edge);
            }
        };

        // Send pulse every 800ms
        this.pulseInterval = window.setInterval(sendPulse, 800);
    }

    private createPulse(edge: NetworkEdge): void {
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        if (!fromNode || !toNode) return;

        // Create pulse circle
        const pulse = this.createCircle(fromNode.x, fromNode.y, 4, this.getAgentColor());
        pulse.setAttribute('opacity', '1');
        pulse.style.filter = 'blur(2px)';
        this.svg.appendChild(pulse);

        // Get path for motion
        const path = edge.element;
        const pathLength = path.getTotalLength();

        // Animate along path
        anime({
            targets: pulse,
            translateX: {
                value: toNode.x - fromNode.x,
                duration: 1000,
            },
            translateY: {
                value: toNode.y - fromNode.y,
                duration: 1000,
            },
            opacity: [1, 0],
            duration: 1000,
            easing: 'easeInQuad',
            complete: () => {
                pulse.remove();
            },
        });
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private updateColors(): void {
        const color = this.getAgentColor();

        this.nodes.forEach((node) => {
            node.element.setAttribute('fill', color);
        });

        this.edges.forEach((edge) => {
            edge.element.setAttribute('stroke', color);
        });
    }

    // ============================================================================
    // Cleanup
    // ============================================================================

    destroy(): void {
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
        }

        super.destroy();
    }
}
