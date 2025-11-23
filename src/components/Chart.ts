/**
 * Chart Component (using lightweight canvas-based rendering)
 */

import { ComponentDefinition, createComponentWrapper } from '../core/component-registry';

export interface ChartProps {
    chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
    data: {
        labels?: string[];
        datasets: Array<{
            label?: string;
            data: number[];
            color?: string;
            fill?: boolean;
        }>;
    };
    options?: {
        title?: string;
        subtitle?: string;
        legend?: boolean;
        grid?: boolean;
        animations?: boolean;
        responsive?: boolean;
        axis?: {
            x?: { label?: string; scale?: string };
            y?: { label?: string; scale?: string; min?: number; max?: number };
        };
    };
}

export const ChartComponent: ComponentDefinition = {
    name: 'chart',
    render: (props: ChartProps, container: HTMLElement) => {
        const wrapper = createComponentWrapper('chart');
        wrapper.className += ' chart';

        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';

        // Title
        if (props.options?.title) {
            const title = document.createElement('h3');
            title.className = 'chart-title';
            title.textContent = props.options.title;
            chartContainer.appendChild(title);
        }

        // Subtitle
        if (props.options?.subtitle) {
            const subtitle = document.createElement('p');
            subtitle.className = 'chart-subtitle';
            subtitle.textContent = props.options.subtitle;
            chartContainer.appendChild(subtitle);
        }

        // Canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'chart-canvas';
        chartContainer.appendChild(canvas);

        // Legend
        if (props.options?.legend !== false && props.data.datasets.length > 1) {
            const legend = createLegend(props.data.datasets);
            chartContainer.appendChild(legend);
        }

        wrapper.appendChild(chartContainer);
        container.appendChild(wrapper);

        // Render chart on canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
            renderChart(ctx, props);
        }

        return {
            element: wrapper,
            update: (newProps: ChartProps) => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Clear and re-render
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    renderChart(ctx, newProps);
                }
            },
            destroy: () => {
                // Cleanup
            },
        };
    },
};

function createLegend(datasets: Array<{ label?: string; color?: string }>): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    datasets.forEach((dataset) => {
        if (!dataset.label) return;

        const item = document.createElement('div');
        item.className = 'legend-item';

        const swatch = document.createElement('span');
        swatch.className = 'legend-swatch';
        swatch.style.backgroundColor = dataset.color || '#6366f1';

        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = dataset.label;

        item.appendChild(swatch);
        item.appendChild(label);
        legend.appendChild(item);
    });

    return legend;
}

function renderChart(ctx: CanvasRenderingContext2D, props: ChartProps): void {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw based on chart type
    switch (props.chart_type) {
        case 'line':
            renderLineChart(ctx, props, padding, chartWidth, chartHeight);
            break;
        case 'bar':
            renderBarChart(ctx, props, padding, chartWidth, chartHeight);
            break;
        case 'pie':
            renderPieChart(ctx, props, padding, chartWidth, chartHeight);
            break;
        default:
            renderLineChart(ctx, props, padding, chartWidth, chartHeight);
    }
}

function renderLineChart(
    ctx: CanvasRenderingContext2D,
    props: ChartProps,
    padding: number,
    width: number,
    height: number
): void {
    const { data, options } = props;

    // Find min/max values
    const allValues = data.datasets.flatMap((d) => d.data);
    const minValue = options?.axis?.y?.min ?? Math.min(...allValues, 0);
    const maxValue = options?.axis?.y?.max ?? Math.max(...allValues);

    // Draw grid
    if (options?.grid !== false) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();
        }
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + height);
    ctx.lineTo(padding + width, padding + height);
    ctx.stroke();

    // Draw datasets
    data.datasets.forEach((dataset, index) => {
        const color = dataset.color || getDefaultColor(index);
        const points = dataset.data.length;
        const xStep = width / (points - 1);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        dataset.data.forEach((value, i) => {
            const x = padding + xStep * i;
            const y = padding + height - ((value - minValue) / (maxValue - minValue)) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Fill area if requested
        if (dataset.fill) {
            ctx.fillStyle = color + '30'; // Add transparency
            ctx.lineTo(padding + width, padding + height);
            ctx.lineTo(padding, padding + height);
            ctx.closePath();
            ctx.fill();
        }

        // Draw points
        ctx.fillStyle = color;
        dataset.data.forEach((value, i) => {
            const x = padding + xStep * i;
            const y = padding + height - ((value - minValue) / (maxValue - minValue)) * height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

function renderBarChart(
    ctx: CanvasRenderingContext2D,
    props: ChartProps,
    padding: number,
    width: number,
    height: number
): void {
    const { data } = props;

    const allValues = data.datasets.flatMap((d) => d.data);
    const maxValue = Math.max(...allValues);

    const barCount = data.datasets[0].data.length;
    const barWidth = width / barCount * 0.8;
    const barSpacing = width / barCount * 0.2;

    data.datasets.forEach((dataset, dsIndex) => {
        const color = dataset.color || getDefaultColor(dsIndex);
        ctx.fillStyle = color;

        dataset.data.forEach((value, i) => {
            const x = padding + (width / barCount) * i + barSpacing / 2;
            const barHeight = (value / maxValue) * height;
            const y = padding + height - barHeight;

            ctx.fillRect(x, y, barWidth, barHeight);
        });
    });
}

function renderPieChart(
    ctx: CanvasRenderingContext2D,
    props: ChartProps,
    padding: number,
    width: number,
    height: number
): void {
    const { data } = props;

    const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
    const centerX = padding + width / 2;
    const centerY = padding + height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    let startAngle = -Math.PI / 2;

    data.datasets[0].data.forEach((value, i) => {
        const sliceAngle = (value / total) * Math.PI * 2;
        const color = getDefaultColor(i);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        startAngle += sliceAngle;
    });
}

function getDefaultColor(index: number): string {
    const colors = [
        '#6366f1', // indigo
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#f59e0b', // amber
        '#10b981', // emerald
        '#3b82f6', // blue
    ];
    return colors[index % colors.length];
}
