/**
 * DataOrganism - Living, breathing data visualization
 * 
 * Chart that grows, morphs, and reacts like an organism
 */

import anime from 'animejs';
import { AgenticAnimation } from './AgenticAnimation';

export interface DataOrganismConfig {
    container: HTMLElement;
    data: number[];
    labels?: string[];
    autoStart?: boolean;
}

// ============================================================================
// DataOrganism Component
// ============================================================================

export class DataOrganism extends AgenticAnimation {
    private svg: SVGSVGElement;
    private data: number[];
    private labels: string[];
    private path: SVGPathElement | null;
    private cells: SVGCircleElement[];
    private width: number;
    private height: number;
    private breathing: boolean;

    constructor(config: DataOrganismConfig) {
        super({
            container: config.container,
            autoStart: config.autoStart ?? true,
            ambientEnabled: true,
        });

        this.data = config.data;
        this.labels = config.labels || [];
        this.path = null;
        this.cells = [];
        this.breathing = true;

        const rect = config.container.getBoundingClientRect();
        this.width = rect.width || 600;
        this.height = rect.height || 300;

        this.svg = this.createSVG(this.width, this.height);
        this.container.appendChild(this.svg);
    }

    // ============================================================================
    // Setup & Render
    // ============================================================================

    protected setup(): void {
        this.container.style.position = 'relative';
        this.container.setAttribute('data-agentic', 'data-organism');
    }

    protected render(): void {
        this.svg.innerHTML = '';
        this.cells = [];

        // Create organism body (line chart)
        this.createOrganismBody();

        // Create cells (data points)
        this.createCells();
    }

    private createOrganismBody(): void {
        if (this.data.length === 0) return;

        const maxValue = Math.max(...this.data);
        const padding = 40;
        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        // Create smooth path
        const points: [number, number][] = this.data.map((value, i) => {
            const x = padding + (chartWidth / (this.data.length - 1)) * i;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;
            return [x, y];
        });

        // Generate smooth curve using quadratic bezier
        let pathData = `M ${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currPoint = points[i];
            const midX = (prevPoint[0] + currPoint[0]) / 2;
            pathData += ` Q ${prevPoint[0]} ${prevPoint[1]}, ${midX} ${(prevPoint[1] + currPoint[1]) / 2
                }`;
        }

        // Create filled area
        const areaPath = this.createPath(pathData, 'none');
        areaPath.setAttribute('fill', this.getAgentColor());
        areaPath.setAttribute('opacity', '0.2');
        areaPath.setAttribute('d', pathData + ` L ${this.width - padding} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`);
        areaPath.setAttribute('data-animate', 'true');
        this.svg.appendChild(areaPath);

        // Create outline
        this.path = this.createPath(pathData, this.getAgentColor(), 3);
        this.path.setAttribute('data-animate', 'true');
        this.path.setAttribute('data-breathe', 'true');
        this.svg.appendChild(this.path);
    }

    private createCells(): void {
        if (this.data.length === 0) return;

        const maxValue = Math.max(...this.data);
        const padding = 40;
        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        this.data.forEach((value, i) => {
            const x = padding + (chartWidth / (this.data.length - 1)) * i;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;

            // Create cell
            const cell = this.createCircle(x, y, 6, this.getAgentColor());
            cell.setAttribute('data-animate', 'true');
            cell.setAttribute('data-breathe', 'true');
            cell.style.filter = 'drop-shadow(0 0 4px currentColor)';
            cell.style.cursor = 'pointer';

            this.svg.appendChild(cell);
            this.cells.push(cell);

            // Add interaction
            cell.addEventListener('mouseenter', () => this.cellReach(cell, x, y));
            cell.addEventListener('mouseleave', () => this.cellRetract(cell, x, y));
        });
    }

    // ============================================================================
    // Animation Overrides
    // ============================================================================

    protected playSpawnAnimation(): void {
        // Organism grows from center
        if (this.path) {
            const pathLength = this.path.getTotalLength();
            this.path.style.strokeDasharray = pathLength.toString();
            this.path.style.strokeDashoffset = pathLength.toString();

            this.addAnimation(
                'spawn-body',
                anime({
                    targets: this.path,
                    strokeDashoffset: [pathLength, 0],
                    duration: 1500,
                    easing: 'easeInOutQuad',
                })
            );
        }

        // Cells appear
        this.addAnimation(
            'spawn-cells',
            anime({
                targets: this.cells,
                scale: [0, 1],
                opacity: [0, 1],
                delay: anime.stagger(100, { start: 500 }),
                duration: 600,
                easing: 'easeOutElastic(1, .5)',
                complete: () => {
                    this.pulse();
                },
            })
        );
    }

    protected playIdleAnimation(): void {
        // Organism breathes
        if (this.path) {
            this.addAnimation(
                'breathe',
                anime({
                    targets: this.path,
                    strokeWidth: [3, 4],
                    opacity: [0.8, 1],
                    duration: 2500,
                    easing: 'easeInOutSine',
                    loop: true,
                    direction: 'alternate',
                })
            );
        }

        // Cells pulse
        this.addAnimation(
            'pulse-cells',
            anime({
                targets: this.cells,
                scale: [1, 1.1],
                duration: 2500,
                delay: anime.stagger(200),
                easing: 'easeInOutSine',
                loop: true,
                direction: 'alternate',
            })
        );
    }

    // ============================================================================
    // Cell Interactions
    // ============================================================================

    private cellReach(cell: SVGCircleElement, originalX: number, originalY: number): void {
        // Cell reaches toward cursor
        anime({
            targets: cell,
            scale: 1.5,
            r: 8,
            duration: 300,
            easing: 'easeOutQuad',
        });

        // Create ripple effect
        const ripple = this.createCircle(originalX, originalY, 6, this.getAgentColor());
        ripple.setAttribute('opacity', '0.5');
        ripple.setAttribute('fill', 'none');
        ripple.setAttribute('stroke', this.getAgentColor());
        ripple.setAttribute('stroke-width', '2');
        this.svg.appendChild(ripple);

        anime({
            targets: ripple,
            r: 30,
            opacity: 0,
            duration: 600,
            easing: 'easeOutQuad',
            complete: () => ripple.remove(),
        });
    }

    private cellRetract(cell: SVGCircleElement, originalX: number, originalY: number): void {
        // Cell returns to normal
        anime({
            targets: cell,
            scale: 1,
            r: 6,
            duration: 400,
            easing: 'easeOutQuad',
        });
    }

    // ============================================================================
    // Data Updates
    // ============================================================================

    updateData(newData: number[]): void {
        // Morph to new data
        const oldData = [...this.data];
        this.data = newData;

        // Animate morph
        this.state = 'morphing';
        this.render();

        // Play morph animation
        if (this.path) {
            anime({
                targets: this.path,
                opacity: [0.5, 1],
                strokeWidth: [5, 3],
                duration: 800,
                easing: 'easeInOutQuad',
                complete: () => {
                    this.state = 'idle';
                    this.pulse();
                },
            });
        }
    }

    // ============================================================================
    // Cleanup
    // ============================================================================

    destroy(): void {
        this.cells = [];
        this.path = null;
        super.destroy();
    }
}
