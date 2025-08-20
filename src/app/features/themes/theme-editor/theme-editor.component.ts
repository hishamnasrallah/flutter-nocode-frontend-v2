// src/app/features/themes/theme-editor/theme-editor.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Theme } from '../../../core/models/theme.model';

interface ContrastCheck {
  name: string;
  foreground: string;
  background: string;
  ratio: string;
  passes: boolean;
  warning: boolean;
}

interface MaterialColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-editor.component.html',
  styleUrls: ['./theme-editor.component.scss']
})
export class ThemeEditorComponent implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private colorChangeSubject = new Subject<void>();

  theme: Theme = {
    id: 0,
    name: 'New Theme',
    primary_color: '#2196F3',
    accent_color: '#FF4081',
    background_color: '#FFFFFF',
    text_color: '#212121',
    font_family: 'Roboto',
    is_dark_mode: false,
    created_at: '',
    updated_at: ''
  };

  originalTheme: Theme | null = null;
  hasChanges = false;
  isNewTheme = true;

  // Additional colors
  surfaceColor = '#FFFFFF';
  secondaryTextColor = '#757575';
  successColor = '#4CAF50';
  warningColor = '#FF9800';
  errorColor = '#F44336';
  infoColor = '#2196F3';

  // Typography
  baseFontSize = 14;
  fontScale = 1.25;

  // Preview
  previewMode: 'phone' | 'tablet' | 'components' = 'phone';

  // Color picker
  showColorPicker = false;
  currentColorTarget: string = '';
  tempColor = '#000000';

  // Accessibility
  contrastChecks: ContrastCheck[] = [];

  // Material colors
  materialColors: MaterialColor[] = [
    { name: 'Red', value: '#F44336' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Deep Purple', value: '#673AB7' },
    { name: 'Indigo', value: '#3F51B5' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Light Blue', value: '#03A9F4' },
    { name: 'Cyan', value: '#00BCD4' },
    { name: 'Teal', value: '#009688' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Light Green', value: '#8BC34A' },
    { name: 'Lime', value: '#CDDC39' },
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Amber', value: '#FFC107' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Deep Orange', value: '#FF5722' },
    { name: 'Brown', value: '#795548' },
    { name: 'Grey', value: '#9E9E9E' },
    { name: 'Blue Grey', value: '#607D8B' }
  ];

  presetColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#000000',
    '#FFFFFF'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const themeId = this.route.snapshot.paramMap.get('id');
    if (themeId && themeId !== 'new') {
      this.loadTheme(parseInt(themeId, 10));
    } else {
      this.isNewTheme = true;
      this.applyThemeToPreview();
    }

    this.setupColorChangeDebouncing();
    this.checkAccessibility();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupColorChangeDebouncing(): void {
    this.colorChangeSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe(() => {
        this.applyThemeToPreview();
        this.checkAccessibility();
        this.markAsChanged();
      });
  }

  loadTheme(id: number): void {
    this.themeService.getTheme(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (theme) => {
          this.theme = { ...theme };
          this.originalTheme = { ...theme };
          this.isNewTheme = false;
          this.loadAdditionalColors();
          this.applyThemeToPreview();
          this.checkAccessibility();
        },
        error: (error) => {
          console.error('Failed to load theme:', error);
          this.notificationService.error('Failed to load theme');
          this.router.navigate(['/themes']);
        }
      });
  }

  private loadAdditionalColors(): void {
    // These would normally come from the theme object
    // For now, generate them based on the primary colors
    this.surfaceColor = this.theme.is_dark_mode ? '#1E1E1E' : '#FFFFFF';
    this.secondaryTextColor = this.theme.is_dark_mode ? '#B0B0B0' : '#757575';

    // Use defaults if not set
    this.successColor = '#4CAF50';
    this.warningColor = '#FF9800';
    this.errorColor = '#F44336';
    this.infoColor = '#2196F3';
  }

  saveTheme(): void {
    if (!this.hasChanges) return;

    const themeData = {
      ...this.theme,
      // Include additional colors in a JSON field or separate fields
    };

    const saveOperation = this.isNewTheme
      ? this.themeService.createTheme(themeData)
      : this.themeService.updateTheme(this.theme.id, themeData);

    saveOperation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedTheme) => {
          this.theme = { ...savedTheme };
          this.originalTheme = { ...savedTheme };
          this.hasChanges = false;
          this.isNewTheme = false;
          this.notificationService.success('Theme saved successfully');
        },
        error: (error) => {
          console.error('Failed to save theme:', error);
          this.notificationService.error('Failed to save theme');
        }
      });
  }

  updateThemeName(): void {
    this.markAsChanged();
  }

  toggleDarkMode(isDark: boolean): void {
    this.theme.is_dark_mode = isDark;

    if (isDark) {
      // Apply dark mode colors
      this.theme.background_color = '#121212';
      this.theme.text_color = '#FFFFFF';
      this.surfaceColor = '#1E1E1E';
      this.secondaryTextColor = '#B0B0B0';
    } else {
      // Apply light mode colors
      this.theme.background_color = '#FFFFFF';
      this.theme.text_color = '#212121';
      this.surfaceColor = '#FFFFFF';
      this.secondaryTextColor = '#757575';
    }

    this.onColorChange('all');
  }

  autoGenerateColors(): void {
    // Generate complementary colors based on primary
    const primary = this.theme.primary_color;

    // Generate accent as complementary
    this.theme.accent_color = this.getComplementaryColor(primary);

    // Adjust text colors based on background
    if (this.theme.is_dark_mode) {
      this.theme.text_color = '#FFFFFF';
      this.secondaryTextColor = '#B0B0B0';
    } else {
      this.theme.text_color = '#212121';
      this.secondaryTextColor = '#757575';
    }

    this.onColorChange('all');
    this.notificationService.success('Colors generated successfully');
  }

  openImagePicker(): void {
    this.imageInput.nativeElement.click();
  }

  extractColorsFromImage(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const colors = this.extractPaletteFromImage(img);
        if (colors.length >= 2) {
          this.theme.primary_color = colors[0];
          this.theme.accent_color = colors[1];
          if (colors.length >= 3) {
            this.theme.background_color = colors[2];
          }
          this.onColorChange('all');
          this.notificationService.success('Colors extracted from image');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    this.imageInput.nativeElement.value = '';
  }

  private extractPaletteFromImage(img: HTMLImageElement): string[] {
    // This is a simplified version - in production, use a library like Vibrant.js
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Simple color extraction - get dominant colors
    const colorMap = new Map<string, number>();

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Round to reduce color variations
      const roundedR = Math.round(r / 32) * 32;
      const roundedG = Math.round(g / 32) * 32;
      const roundedB = Math.round(b / 32) * 32;

      const hex = this.rgbToHex(roundedR, roundedG, roundedB);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    return sortedColors;
  }

  onColorChange(target: string): void {
    this.colorChangeSubject.next();
  }

  onFontChange(): void {
    this.applyThemeToPreview();
    this.markAsChanged();
  }

  openColorPicker(target: string): void {
    this.currentColorTarget = target;

    switch (target) {
      case 'primary':
        this.tempColor = this.theme.primary_color;
        break;
      case 'accent':
        this.tempColor = this.theme.accent_color;
        break;
      case 'background':
        this.tempColor = this.theme.background_color;
        break;
      case 'text':
        this.tempColor = this.theme.text_color;
        break;
      case 'surface':
        this.tempColor = this.surfaceColor;
        break;
      case 'secondaryText':
        this.tempColor = this.secondaryTextColor;
        break;
      case 'success':
        this.tempColor = this.successColor;
        break;
      case 'warning':
        this.tempColor = this.warningColor;
        break;
      case 'error':
        this.tempColor = this.errorColor;
        break;
      case 'info':
        this.tempColor = this.infoColor;
        break;
    }

    this.showColorPicker = true;
  }

  closeColorPicker(): void {
    this.showColorPicker = false;
  }

  onTempColorChange(): void {
    // Live preview while picking
  }

  selectPresetColor(color: string): void {
    this.tempColor = color;
  }

  applyColor(): void {
    switch (this.currentColorTarget) {
      case 'primary':
        this.theme.primary_color = this.tempColor;
        break;
      case 'accent':
        this.theme.accent_color = this.tempColor;
        break;
      case 'background':
        this.theme.background_color = this.tempColor;
        break;
      case 'text':
        this.theme.text_color = this.tempColor;
        break;
      case 'surface':
        this.surfaceColor = this.tempColor;
        break;
      case 'secondaryText':
        this.secondaryTextColor = this.tempColor;
        break;
      case 'success':
        this.successColor = this.tempColor;
        break;
      case 'warning':
        this.warningColor = this.tempColor;
        break;
      case 'error':
        this.errorColor = this.tempColor;
        break;
      case 'info':
        this.infoColor = this.tempColor;
        break;
    }

    this.onColorChange(this.currentColorTarget);
    this.closeColorPicker();
  }

  applyMaterialColor(color: MaterialColor): void {
    this.theme.primary_color = color.value;

    // Generate complementary accent
    this.theme.accent_color = this.getComplementaryColor(color.value);

    this.onColorChange('all');
  }

  getPrimaryShades(): string[] {
    return this.generateColorShades(this.theme.primary_color);
  }

  getAccentShades(): string[] {
    return this.generateColorShades(this.theme.accent_color);
  }

  private generateColorShades(baseColor: string): string[] {
    const shades: string[] = [];
    const rgb = this.hexToRgb(baseColor);

    // Generate 5 shades
    for (let i = -2; i <= 2; i++) {
      const factor = 1 + (i * 0.2);
      const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
      const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
      const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
      shades.push(this.rgbToHex(r, g, b));
    }

    return shades;
  }

  private applyThemeToPreview(): void {
    // Apply theme to CSS variables for live preview
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', this.theme.primary_color);
    root.style.setProperty('--theme-accent', this.theme.accent_color);
    root.style.setProperty('--theme-background', this.theme.background_color);
    root.style.setProperty('--theme-text', this.theme.text_color);
    root.style.setProperty('--theme-surface', this.surfaceColor);
    root.style.setProperty('--theme-secondary-text', this.secondaryTextColor);
  }

  checkAccessibility(): void {
    this.contrastChecks = [
      this.checkContrast('Text on Background', this.theme.text_color, this.theme.background_color),
      this.checkContrast('Primary on Background', this.theme.primary_color, this.theme.background_color),
      this.checkContrast('White on Primary', '#FFFFFF', this.theme.primary_color),
      this.checkContrast('White on Accent', '#FFFFFF', this.theme.accent_color),
      this.checkContrast('Text on Surface', this.theme.text_color, this.surfaceColor),
      this.checkContrast('Secondary on Background', this.secondaryTextColor, this.theme.background_color)
    ];
  }

  private checkContrast(name: string, foreground: string, background: string): ContrastCheck {
    const ratio = this.calculateContrastRatio(foreground, background);
    const ratioValue = parseFloat(ratio);

    return {
      name,
      foreground,
      background,
      ratio,
      passes: ratioValue >= 4.5,
      warning: ratioValue >= 3.0 && ratioValue < 4.5
    };
  }

  private calculateContrastRatio(color1: string, color2: string): string {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return ratio.toFixed(2);
  }

  private getRelativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  getContrastColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  private getComplementaryColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const r = 255 - rgb.r;
    const g = 255 - rgb.g;
    const b = 255 - rgb.b;
    return this.rgbToHex(r, g, b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private markAsChanged(): void {
    if (!this.originalTheme) {
      this.hasChanges = true;
      return;
    }

    this.hasChanges = JSON.stringify(this.theme) !== JSON.stringify(this.originalTheme);
  }

  resetTheme(): void {
    if (!this.originalTheme) {
      // Reset to defaults for new theme
      this.theme = {
        id: 0,
        name: 'New Theme',
        primary_color: '#2196F3',
        accent_color: '#FF4081',
        background_color: '#FFFFFF',
        text_color: '#212121',
        font_family: 'Roboto',
        is_dark_mode: false,
        created_at: '',
        updated_at: ''
      };
    } else {
      // Reset to original
      this.theme = { ...this.originalTheme };
    }

    this.loadAdditionalColors();
    this.onColorChange('all');
    this.hasChanges = false;
  }

  exportTheme(): void {
    const exportData = {
      ...this.theme,
      surfaceColor: this.surfaceColor,
      secondaryTextColor: this.secondaryTextColor,
      successColor: this.successColor,
      warningColor: this.warningColor,
      errorColor: this.errorColor,
      infoColor: this.infoColor
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.theme.name.toLowerCase().replace(/\\s+/g, '-')}-theme.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.success('Theme exported successfully');
  }

  goBack(): void {
    if (this.hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    this.router.navigate(['/themes']);
  }
}
