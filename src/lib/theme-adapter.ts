import { ThemeColors } from "@/types";

/**
 * Theme adaptation utilities for matching Shopify store themes
 */
export class ThemeAdapter {
  private static instance: ThemeAdapter;
  private currentTheme: ThemeColors | null = null;
  private observers: Array<(colors: ThemeColors) => void> = [];

  private constructor() {}

  static getInstance(): ThemeAdapter {
    if (!this.instance) {
      this.instance = new ThemeAdapter();
    }
    return this.instance;
  }

  /**
   * Extract colors from the current page's CSS
   */
  async extractThemeColors(): Promise<ThemeColors> {
    try {
      // Get computed styles from the document
      const computedStyle = getComputedStyle(document.documentElement);
      
      // Try to extract Shopify theme colors from CSS variables
      const extractedColors: ThemeColors = {
        primary: this.extractCSSColor(computedStyle, [
          '--color-primary',
          '--colors-accent-1',
          '--color-accent',
          '--brand-color'
        ]) || '#00A651',
        
        secondary: this.extractCSSColor(computedStyle, [
          '--color-secondary',
          '--colors-accent-2',
          '--color-secondary-accent'
        ]) || '#7C2D8E',
        
        accent: this.extractCSSColor(computedStyle, [
          '--color-accent',
          '--colors-button',
          '--color-button'
        ]) || '#4A90E2',
        
        background: this.extractCSSColor(computedStyle, [
          '--color-background',
          '--colors-background-1',
          '--color-body'
        ]) || '#FFFFFF',
        
        foreground: this.extractCSSColor(computedStyle, [
          '--color-foreground',
          '--colors-text',
          '--color-text'
        ]) || '#202223',
      };

      // Fallback: analyze dominant colors from page elements
      if (this.isDefaultColors(extractedColors)) {
        const dominantColors = await this.analyzeDominantColors();
        Object.assign(extractedColors, dominantColors);
      }

      this.currentTheme = extractedColors;
      this.notifyObservers(extractedColors);
      
      return extractedColors;
    } catch (error) {
      console.warn('Failed to extract theme colors:', error);
      return this.getDefaultColors();
    }
  }

  /**
   * Apply extracted colors to the BudgetPrice widget
   */
  applyThemeColors(colors: ThemeColors): void {
    const root = document.documentElement;
    
    // Update CSS custom properties
    root.style.setProperty('--shopify-green', colors.primary);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);

    // Store in sessionStorage for consistency
    try {
      sessionStorage.setItem('budgetprice_theme_colors', JSON.stringify(colors));
    } catch (error) {
      console.warn('Failed to store theme colors:', error);
    }
  }

  /**
   * Get stored theme colors
   */
  getStoredThemeColors(): ThemeColors | null {
    try {
      const stored = sessionStorage.getItem('budgetprice_theme_colors');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Subscribe to theme color changes
   */
  subscribe(callback: (colors: ThemeColors) => void): () => void {
    this.observers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Generate accessible color variants
   */
  generateColorVariants(baseColor: string): {
    light: string;
    dark: string;
    contrast: string;
  } {
    const hsl = this.hexToHsl(baseColor);
    
    return {
      light: this.hslToHex({
        ...hsl,
        l: Math.min(95, hsl.l + 30)
      }),
      dark: this.hslToHex({
        ...hsl,
        l: Math.max(5, hsl.l - 30)
      }),
      contrast: hsl.l > 50 ? '#000000' : '#FFFFFF'
    };
  }

  /**
   * Check color contrast ratio for accessibility
   */
  checkContrastRatio(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
    };
  }

  // Private helper methods
  private extractCSSColor(computedStyle: CSSStyleDeclaration, variables: string[]): string | null {
    for (const variable of variables) {
      const value = computedStyle.getPropertyValue(variable).trim();
      if (value && this.isValidColor(value)) {
        return this.normalizeColor(value);
      }
    }
    return null;
  }

  private async analyzeDominantColors(): Promise<Partial<ThemeColors>> {
    // Analyze colors from page elements (simplified version)
    const elements = document.querySelectorAll('button, .btn, a[class*="button"], .button');
    const colors: string[] = [];

    elements.forEach(el => {
      const style = getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const color = style.color;
      
      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colors.push(bgColor);
      }
      if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        colors.push(color);
      }
    });

    // Simple dominant color extraction
    const colorCounts = new Map<string, number>();
    colors.forEach(color => {
      const normalized = this.normalizeColor(color);
      colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
    });

    const dominant = Array.from(colorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([color]) => color);

    return {
      primary: dominant[0] || '#00A651',
      secondary: dominant[1] || '#7C2D8E',
      accent: dominant[2] || '#4A90E2',
    };
  }

  private isDefaultColors(colors: ThemeColors): boolean {
    return colors.primary === '#00A651' && 
           colors.secondary === '#7C2D8E' && 
           colors.accent === '#4A90E2';
  }

  private getDefaultColors(): ThemeColors {
    return {
      primary: '#00A651',
      secondary: '#7C2D8E',
      accent: '#4A90E2',
      background: '#FFFFFF',
      foreground: '#202223',
    };
  }

  private isValidColor(color: string): boolean {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  private normalizeColor(color: string): string {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const normalized = getComputedStyle(div).color;
    document.body.removeChild(div);
    return this.rgbToHex(normalized);
  }

  private rgbToHex(rgb: string): string {
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    
    const [r, g, b] = result.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(hsl: { h: number; s: number; l: number }): string {
    const { h, s, l } = hsl;
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1));
    const m = lNorm - c / 2;

    let r, g, b;
    if (hNorm < 1/6) [r, g, b] = [c, x, 0];
    else if (hNorm < 2/6) [r, g, b] = [x, c, 0];
    else if (hNorm < 3/6) [r, g, b] = [0, c, x];
    else if (hNorm < 4/6) [r, g, b] = [0, x, c];
    else if (hNorm < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const rInt = Math.round((r + m) * 255);
    const gInt = Math.round((g + m) * 255);
    const bInt = Math.round((b + m) * 255);

    return `#${((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1)}`;
  }

  private getLuminance(color: string): number {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
  }

  private notifyObservers(colors: ThemeColors): void {
    this.observers.forEach(callback => {
      try {
        callback(colors);
      } catch (error) {
        console.warn('Theme observer error:', error);
      }
    });
  }
}
