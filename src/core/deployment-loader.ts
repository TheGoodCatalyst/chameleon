/**
 * Deployment Configuration Types
 */

export interface DeploymentConfig {
    deployment_id: string;
    brand: BrandConfig;
    design_principles?: DesignPrinciples;
    interaction_mechanisms?: InteractionMechanisms;
    component_overrides?: ComponentOverrides;
    features?: Features;
    localization?: Localization;
    metadata?: DeploymentMetadata;
}

export interface BrandConfig {
    name: string;
    logo?: {
        url: string;
        dark_url?: string;
        width?: number;
        height?: number;
    };
    theme: ThemeConfig;
}

export interface ThemeConfig {
    mode?: 'light' | 'dark' | 'auto';
    colors: ColorPalette;
    typography: Typography;
    spacing?: SpacingConfig;
    border_radius?: BorderRadiusConfig;
    shadows?: ShadowsConfig;
}

export interface ColorPalette {
    primary: string;
    secondary?: string;
    accent?: string;
    surface: string;
    surface_variant?: string;
    text_primary?: string;
    text_secondary?: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
}

export interface Typography {
    heading: string;
    body: string;
    monospace?: string;
}

export interface SpacingConfig {
    base_unit?: number;
}

export interface BorderRadiusConfig {
    small?: string;
    medium?: string;
    large?: string;
}

export interface ShadowsConfig {
    small?: string;
    medium?: string;
    large?: string;
}

export interface DesignPrinciples {
    density?: 'compact' | 'comfortable' | 'spacious';
    animations?: 'none' | 'reduced' | 'smooth' | 'playful';
    effects?: {
        glassmorphism?: boolean;
        neumorphism?: boolean;
        gradients?: boolean;
        blur?: boolean;
    };
    layout?: {
        max_width?: string;
        sidebar_position?: 'left' | 'right';
    };
}

export interface InteractionMechanisms {
    feedback_mode?: 'immediate' | 'debounced' | 'on_submit';
    debounce_ms?: number;
    confirmation_style?: 'inline' | 'modal' | 'toast';
    error_display?: 'toast' | 'inline' | 'modal' | 'banner';
    loading_indicators?: {
        style?: 'spinner' | 'skeleton' | 'progress' | 'pulse';
        delay_ms?: number;
    };
    keyboard_shortcuts?: boolean;
    haptic_feedback?: boolean;
}

export interface ComponentOverrides {
    [componentName: string]: {
        module: string;
        props_mapping?: Record<string, string>;
    };
}

export interface Features {
    voice_input?: boolean;
    search?: boolean;
    history?: boolean;
    exports?: boolean;
    collaboration?: boolean;
    analytics?: boolean;
}

export interface Localization {
    default_locale?: string;
    supported_locales?: string[];
    translations_url?: string;
}

export interface DeploymentMetadata {
    version?: string;
    created_at?: string;
    updated_at?: string;
    owner?: string;
    tags?: string[];
}

// ============================================================================
// Deployment Loader
// ============================================================================

export class DeploymentLoader {
    private config: DeploymentConfig | null = null;

    /**
     * Load deployment configuration from URL or object
     */
    async load(source: string | DeploymentConfig): Promise<DeploymentConfig> {
        if (typeof source === 'string') {
            // Load from URL
            const response = await fetch(source);
            if (!response.ok) {
                throw new Error(`Failed to load deployment config: ${response.statusText}`);
            }
            this.config = await response.json();
        } else {
            this.config = source;
        }

        return this.config;
    }

    /**
     * Get the loaded configuration
     */
    getConfig(): DeploymentConfig {
        if (!this.config) {
            throw new Error('No deployment configuration loaded');
        }
        return this.config;
    }

    /**
     * Apply brand theme to DOM
     */
    applyBrand(): void {
        const config = this.getConfig();
        const theme = config.brand.theme;

        // Set CSS custom properties
        const root = document.documentElement;

        // Colors
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key.replace(/_/g, '-')}`, value);
        });

        // Typography
        root.style.setProperty('--font-heading', theme.typography.heading);
        root.style.setProperty('--font-body', theme.typography.body);
        if (theme.typography.monospace) {
            root.style.setProperty('--font-monospace', theme.typography.monospace);
        }

        // Spacing
        if (theme.spacing?.base_unit) {
            root.style.setProperty('--spacing-unit', `${theme.spacing.base_unit}px`);
        }

        // Border radius
        if (theme.border_radius) {
            Object.entries(theme.border_radius).forEach(([key, value]) => {
                root.style.setProperty(`--radius-${key}`, value);
            });
        }

        // Shadows
        if (theme.shadows) {
            Object.entries(theme.shadows).forEach(([key, value]) => {
                root.style.setProperty(`--shadow-${key}`, value);
            });
        }

        // Design principles
        if (config.design_principles) {
            const { density, animations, effects, layout } = config.design_principles;

            if (density) {
                root.setAttribute('data-density', density);
            }

            if (animations) {
                root.setAttribute('data-animations', animations);
            }

            if (effects) {
                Object.entries(effects).forEach(([key, value]) => {
                    root.setAttribute(`data-effect-${key}`, String(value));
                });
            }

            if (layout?.max_width) {
                root.style.setProperty('--max-width', layout.max_width);
            }
        }

        // Theme mode
        if (theme.mode) {
            if (theme.mode === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
                root.setAttribute('data-theme', theme.mode);
            }
        }
    }

    /**
     * Get component override for a component name
     */
    getComponentOverride(componentName: string): ComponentOverrides[string] | null {
        const overrides = this.getConfig().component_overrides;
        return overrides?.[componentName] || null;
    }

    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature: keyof Features): boolean {
        const features = this.getConfig().features;
        return features?.[feature] ?? false;
    }

    /**
     * Get interaction mechanism setting
     */
    getInteractionSetting<K extends keyof InteractionMechanisms>(
        key: K
    ): InteractionMechanisms[K] {
        const mechanisms = this.getConfig().interaction_mechanisms;
        return mechanisms?.[key] as InteractionMechanisms[K];
    }
}
