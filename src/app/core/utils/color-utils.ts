// src/app/core/utils/color-utils.ts

export class ColorUtils {
  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to hex color
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Check if a string is a valid hex color
   */
  static isValidHex(hex: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  /**
   * Get Material Design color palette
   */
  static getMaterialColors(): string[] {
    return [
      // Red
      '#F44336', '#E91E63',
      // Purple
      '#9C27B0', '#673AB7',
      // Blue
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      // Green
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      // Yellow/Orange
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
      // Brown/Grey
      '#795548', '#9E9E9E', '#607D8B',
      // Black/White
      '#000000', '#FFFFFF'
    ];
  }

  /**
   * Get Material Design color variations
   */
  static getMaterialColorShades(baseColor: string): string[] {
    const shades: Record<string, string[]> = {
      '#F44336': ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
      '#E91E63': ['#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
      '#9C27B0': ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
      '#673AB7': ['#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92'],
      '#3F51B5': ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E'],
      '#2196F3': ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
      '#00BCD4': ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064'],
      '#4CAF50': ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
      '#FFC107': ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00'],
      '#FF5722': ['#FBE9E7', '#FFCCBC', '#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#D84315', '#BF360C']
    };

    return shades[baseColor] || [baseColor];
  }

  /**
   * Calculate contrast color (black or white) for text on a background
   */
  static contrastColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    // Calculate relative luminance
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  /**
   * Lighten a color by a percentage
   */
  static lighten(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    const factor = 1 + (percent / 100);

    const r = Math.min(255, Math.round(rgb.r * factor));
    const g = Math.min(255, Math.round(rgb.g * factor));
    const b = Math.min(255, Math.round(rgb.b * factor));

    return this.rgbToHex(r, g, b);
  }

  /**
   * Darken a color by a percentage
   */
  static darken(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    const factor = 1 - (percent / 100);

    const r = Math.max(0, Math.round(rgb.r * factor));
    const g = Math.max(0, Math.round(rgb.g * factor));
    const b = Math.max(0, Math.round(rgb.b * factor));

    return this.rgbToHex(r, g, b);
  }

  /**
   * Convert hex to RGBA with opacity
   */
  static hexToRgba(hex: string, opacity: number): string {
    const rgb = this.hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  /**
   * Generate a random hex color
   */
  static randomHex(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /**
   * Get complementary color
   */
  static getComplementary(hex: string): string {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
  }

  /**
   * Mix two colors
   */
  static mix(hex1: string, hex2: string, ratio: number = 0.5): string {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex(r, g, b);
  }

  /**
   * Convert color name to hex
   */
  static nameToHex(colorName: string): string | null {
    const colors: Record<string, string> = {
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'white': '#FFFFFF',
      'black': '#000000',
      'yellow': '#FFFF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'silver': '#C0C0C0',
      'gray': '#808080',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'teal': '#008080',
      'navy': '#000080',
      'fuchsia': '#FF00FF',
      'purple': '#800080',
      'orange': '#FFA500',
      'brown': '#A52A2A',
      'pink': '#FFC0CB',
      'gold': '#FFD700',
      'indigo': '#4B0082',
      'violet': '#EE82EE'
    };

    return colors[colorName.toLowerCase()] || null;
  }

  /**
   * Get gradient from two colors
   */
  static getGradient(startHex: string, endHex: string, direction: string = '90deg'): string {
    return `linear-gradient(${direction}, ${startHex}, ${endHex})`;
  }

  /**
   * Check if color is dark
   */
  static isDark(hex: string): boolean {
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness < 128;
  }

  /**
   * Check if color is light
   */
  static isLight(hex: string): boolean {
    return !this.isDark(hex);
  }
}
