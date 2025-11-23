/**
 * SVG Morphing Utilities
 * 
 * Utilities for smooth shape-to-shape transitions using Anime.js
 */

import anime from 'animejs';

// ============================================================================
// Path Shape Generators
// ============================================================================

export interface ShapeConfig {
    cx: number;
    cy: number;
    size: number;
}

/**
 * Generate SVG path for a circle
 */
export function circlePathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    // Using path approximation for smooth morphing
    const r = size / 2;
    return `M ${cx - r},${cy} 
    a ${r},${r} 0 1,0 ${r * 2},0 
    a ${r},${r} 0 1,0 ${-r * 2},0`;
}

/**
 * Generate SVG path for a square
 */
export function squarePathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    const half = size / 2;
    return `M ${cx - half},${cy - half} 
    L ${cx + half},${cy - half} 
    L ${cx + half},${cy + half} 
    L ${cx - half},${cy + half} 
    Z`;
}

/**
 * Generate SVG path for a triangle
 */
export function trianglePathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    const height = (size * Math.sqrt(3)) / 2;
    return `M ${cx},${cy - height / 2} 
    L ${cx + size / 2},${cy + height / 2} 
    L ${cx - size / 2},${cy + height / 2} 
    Z`;
}

/**
 * Generate SVG path for a star
 */
export function starPathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const points = 5;

    let path = '';
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / points) * i - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        path += (i === 0 ? 'M' : ' L') + ` ${x},${y}`;
    }
    return path + ' Z';
}

/**
 * Generate SVG path for a hexagon
 */
export function hexagonPathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    const radius = size / 2;
    let path = '';

    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        path += (i === 0 ? 'M' : ' L') + ` ${x},${y}`;
    }
    return path + ' Z';
}

/**
 * Generate SVG path for a heart
 */
export function heartPathData(config: ShapeConfig): string {
    const { cx, cy, size } = config;
    const scale = size / 100;

    // Heart shape centered at origin, then translated
    const path = `M ${cx},${cy - 20 * scale}
    C ${cx},${cy - 30 * scale} ${cx - 20 * scale},${cy - 40 * scale} ${cx - 40 * scale},${cy - 40 * scale}
    C ${cx - 60 * scale},${cy - 40 * scale} ${cx - 60 * scale},${cy - 20 * scale} ${cx - 60 * scale},${cy}
    C ${cx - 60 * scale},${cy + 20 * scale} ${cx - 40 * scale},${cy + 40 * scale} ${cx},${cy + 60 * scale}
    C ${cx + 40 * scale},${cy + 40 * scale} ${cx + 60 * scale},${cy + 20 * scale} ${cx + 60 * scale},${cy}
    C ${cx + 60 * scale},${cy - 20 * scale} ${cx + 60 * scale},${cy - 40 * scale} ${cx + 40 * scale},${cy - 40 * scale}
    C ${cx + 20 * scale},${cy - 40 * scale} ${cx},${cy - 30 * scale} ${cx},${cy - 20 * scale} Z`;

    return path;
}

// ============================================================================
// Morphing Functions
// ============================================================================

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'hexagon' | 'heart';

const shapeGenerators: Record<ShapeType, (config: ShapeConfig) => string> = {
    circle: circlePathData,
    square: squarePathData,
    triangle: trianglePathData,
    star: starPathData,
    hexagon: hexagonPathData,
    heart: heartPathData,
};

/**
 * Morph an SVG path from one shape to another
 */
export function morphShape(
    pathElement: SVGPathElement,
    fromShape: ShapeType,
    toShape: ShapeType,
    config: ShapeConfig,
    duration: number = 1000,
    easing: string = 'easeInOutQuad'
): anime.AnimeInstance {
    const fromPath = shapeGenerators[fromShape](config);
    const toPath = shapeGenerators[toShape](config);

    pathElement.setAttribute('d', fromPath);

    return anime({
        targets: pathElement,
        d: [{ value: toPath }],
        duration,
        easing,
    });
}

/**
 * Create a morphing sequence through multiple shapes
 */
export function morphSequence(
    pathElement: SVGPathElement,
    shapes: ShapeType[],
    config: ShapeConfig,
    durationPerShape: number = 1000,
    easing: string = 'easeInOutQuad'
): anime.AnimeTimelineInstance {
    const timeline = anime.timeline({
        easing,
        loop: true,
    });

    shapes.forEach((shape, index) => {
        const nextShape = shapes[(index + 1) % shapes.length];
        const fromPath = shapeGenerators[shape](config);
        const toPath = shapeGenerators[nextShape](config);

        if (index === 0) {
            pathElement.setAttribute('d', fromPath);
        }

        timeline.add({
            targets: pathElement,
            d: [{ value: toPath }],
            duration: durationPerShape,
        });
    });

    return timeline;
}

/**
 * Interpolate between two custom SVG paths
 */
export function morphCustomPath(
    pathElement: SVGPathElement,
    fromPath: string,
    toPath: string,
    duration: number = 1000,
    easing: string = 'easeInOutCubic'
): anime.AnimeInstance {
    pathElement.setAttribute('d', fromPath);

    return anime({
        targets: pathElement,
        d: [{ value: toPath }],
        duration,
        easing,
    });
}

// ============================================================================
// Advanced Morphing Effects
// ============================================================================

/**
 * Morph with color transition
 */
export function morphWithColor(
    pathElement: SVGPathElement,
    fromShape: ShapeType,
    toShape: ShapeType,
    config: ShapeConfig,
    fromColor: string,
    toColor: string,
    duration: number = 1000
): anime.AnimeInstance {
    const fromPath = shapeGenerators[fromShape](config);
    const toPath = shapeGenerators[toShape](config);

    pathElement.setAttribute('d', fromPath);
    pathElement.setAttribute('fill', fromColor);

    return anime({
        targets: pathElement,
        d: [{ value: toPath }],
        fill: toColor,
        duration,
        easing: 'easeInOutQuad',
    });
}

/**
 * Morph with scale and rotation
 */
export function morphWithTransform(
    pathElement: SVGPathElement,
    fromShape: ShapeType,
    toShape: ShapeType,
    config: ShapeConfig,
    scale: number = 1.2,
    rotation: number = 180,
    duration: number = 1000
): anime.AnimeInstance {
    const fromPath = shapeGenerators[fromShape](config);
    const toPath = shapeGenerators[toShape](config);

    pathElement.setAttribute('d', fromPath);

    return anime({
        targets: pathElement,
        d: [{ value: toPath }],
        scale: [1, scale, 1],
        rotate: [0, rotation, 0],
        duration,
        easing: 'easeInOutQuad',
    });
}

/**
 * Dissolve morph (fade out old, fade in new)
 */
export function dissolveMorph(
    pathElement: SVGPathElement,
    fromShape: ShapeType,
    toShape: ShapeType,
    config: ShapeConfig,
    duration: number = 1000
): anime.AnimeTimelineInstance {
    const fromPath = shapeGenerators[fromShape](config);
    const toPath = shapeGenerators[toShape](config);

    pathElement.setAttribute('d', fromPath);

    const timeline = anime.timeline();

    // Fade out
    timeline.add({
        targets: pathElement,
        opacity: [1, 0],
        scale: [1, 0.5],
        duration: duration / 2,
        easing: 'easeInQuad',
    });

    // Change shape while invisible
    timeline.add({
        targets: pathElement,
        d: [{ value: toPath }],
        duration: 0,
        complete: () => {
            pathElement.setAttribute('d', toPath);
        },
    });

    // Fade in
    timeline.add({
        targets: pathElement,
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: duration / 2,
        easing: 'easeOutQuad',
    });

    return timeline;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get path data for a shape type
 */
export function getShapePath(shape: ShapeType, config: ShapeConfig): string {
    return shapeGenerators[shape](config);
}

/**
 * Create an SVG path element with a shape
 */
export function createShapePath(
    shape: ShapeType,
    config: ShapeConfig,
    fill: string = '#6366f1',
    stroke?: string
): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', getShapePath(shape, config));
    path.setAttribute('fill', fill);

    if (stroke) {
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', '2');
    }

    return path;
}

/**
 * Normalize path to have same number of points for smooth morphing
 * (Simplified version - for production use consider more sophisticated libraries)
 */
export function normalizePath(pathData: string, targetPoints: number = 20): string {
    // This is a simplified implementation
    // For production, consider using libraries like flubber or svg-path-properties
    return pathData;
}
