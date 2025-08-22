// src/app/features/themes/theme-list/theme-list.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Theme } from '../../../core/models/theme.model';
import { Application } from '../../../core/models/application.model';

interface ColorHarmony {
  name: string;
  colors: string[];
  description: string;
}

interface ContrastCheck {
  name: string;
  foreground: string;
  background: string;
  ratio: string;
  passesAA: boolean;
  passesAAA: boolean;
}

@Component({
  selector: 'app-theme-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-list.component.html',
  styleUrls: ['./theme-list.component.scss']
})
export class ThemeListComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  themes: Theme[] = [];
  filteredThemes: Theme[] = [];
  presetThemes: Partial<Theme>[] = [];
  selectedTheme: Theme | null = null;
  currentTheme: Theme | null = null;
  currentApplication: Application | null = null;

  isLoading = true;
  searchQuery = '';
  filter: 'all' | 'light' | 'dark' | 'custom' = 'all';
  menuOpenFor: number | null = null;

  showSuggestions = false;
  colorHarmonies: ColorHarmony[] = [];

  showAccessibilityReport = false;
  contrastChecks: ContrastCheck[] = [];

  constructor(
    private themeService: ThemeService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadThemes();
    this.loadPresetThemes();
    this.subscribeToCurrentTheme();
    this.subscribeToCurrentApplication();
    this.generateColorHarmonies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadThemes(): void {
    this.isLoading = true;
    this.themeService.getThemes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.themes = response.results;
          this.filterThemes();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load themes:', error);
          this.notificationService.error('Failed to load themes');
          this.isLoading = false;
        }
      });
  }

  loadPresetThemes(): void {
    this.presetThemes = this.themeService.getPresetThemes();
  }

  subscribeToCurrentTheme(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });
  }

  subscribeToCurrentApplication(): void {
    this.applicationService.currentApplication$
      .pipe(takeUntil(this.destroy$))
      .subscribe(app => {
        this.currentApplication = app;
      });
  }

  filterThemes(): void {
    let filtered = [...this.themes];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(theme =>
        theme.name.toLowerCase().includes(query) ||
        theme.font_family.toLowerCase().includes(query)
      );
    }

    // Apply mode filter
    switch (this.filter) {
      case 'light':
        filtered = filtered.filter(t => !t.is_dark_mode);
        break;
      case 'dark':
        filtered = filtered.filter(t => t.is_dark_mode);
        break;
      case 'custom':
        // Show only user-created themes (logic depends on your backend)
        break;
    }

    this.filteredThemes = filtered;
  }

  setFilter(filter: 'all' | 'light' | 'dark' | 'custom'): void {
    this.filter = filter;
    this.filterThemes();
  }

  createNewTheme(): void {
    const newTheme = {
      name: 'New Theme',
      primary_color: '#2196F3',
      accent_color: '#FF4081',
      background_color: '#FFFFFF',
      text_color: '#212121',
      font_family: 'Roboto',
      is_dark_mode: false
    };

    this.themeService.createTheme(newTheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (theme) => {
          this.notificationService.success('Theme created successfully');
          this.router.navigate(['/themes', theme.id]);
        },
        error: (error) => {
          console.error('Failed to create theme:', error);
          this.notificationService.error('Failed to create theme');
        }
      });
  }

  editTheme(theme: Theme): void {
    this.router.navigate(['/themes', theme.id]);
  }

  applyTheme(theme: Theme): void {
    if (!this.currentApplication) {
      this.notificationService.warning('No application selected');
      return;
    }

    this.applicationService.updateApplication(this.currentApplication.id, { theme_id: theme.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.currentTheme = theme;
          this.themeService.applyTheme(theme);
          this.notificationService.success(`Theme "${theme.name}" applied successfully`);
        },
        error: (error) => {
          console.error('Failed to apply theme:', error);
          this.notificationService.error('Failed to apply theme');
        }
      });
  }

  applyPresetTheme(preset: Partial<Theme>): void {
    const newTheme = {
      ...preset,
      name: `${preset.name} (Custom)`
    };

    this.themeService.createTheme(newTheme as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (theme) => {
          this.themes.unshift(theme);
          this.filterThemes();
          this.applyTheme(theme);
        },
        error: (error) => {
          console.error('Failed to create theme from preset:', error);
          this.notificationService.error('Failed to create theme from preset');
        }
      });
  }

  duplicateTheme(theme: Theme): void {
    this.themeService.duplicateTheme(theme.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newTheme) => {
          this.themes.unshift(newTheme);
          this.filterThemes();
          this.notificationService.success(`Theme "${theme.name}" duplicated successfully`);
        },
        error: (error) => {
          console.error('Failed to duplicate theme:', error);
          this.notificationService.error('Failed to duplicate theme');
        }
      });
  }

  deleteTheme(theme: Theme): void {
    if (!confirm(`Delete theme "${theme.name}"? This action cannot be undone.`)) {
      return;
    }

    this.themeService.deleteTheme(theme.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.themes = this.themes.filter(t => t.id !== theme.id);
          this.filterThemes();
          this.notificationService.success(`Theme "${theme.name}" deleted successfully`);
        },
        error: (error) => {
          console.error('Failed to delete theme:', error);
          this.notificationService.error('Failed to delete theme');
        }
      });
  }

  previewTheme(theme: Theme): void {
    this.selectedTheme = theme;
    this.themeService.applyTheme(theme);
  }

  exportTheme(theme: Theme): void {
    const data = JSON.stringify(theme, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.name.toLowerCase().replace(/\\s+/g, '-')}-theme.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.success('Theme exported successfully');
  }

  exportAllThemes(): void {
    const data = JSON.stringify(this.themes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-themes.json';
    link.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.success(`${this.themes.length} themes exported successfully`);
  }

  importThemes(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const themes = Array.isArray(data) ? data : [data];

        let imported = 0;
        themes.forEach(themeData => {
          const { id, created_at, updated_at, ...createData } = themeData;
          this.themeService.createTheme(createData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (theme) => {
                this.themes.unshift(theme);
                imported++;
                if (imported === themes.length) {
                  this.filterThemes();
                  this.notificationService.success(`${imported} theme(s) imported successfully`);
                }
              },
              error: (error) => {
                console.error('Failed to import theme:', error);
              }
            });
        });
      } catch (error) {
        console.error('Invalid theme file:', error);
        this.notificationService.error('Invalid theme file format');
      }
    };
    reader.readAsText(file);

    // Reset input
    this.fileInput.nativeElement.value = '';
  }

  shareTheme(theme: Theme): void {
    const url = `${window.location.origin}/themes/${theme.id}`;

    if (navigator.share) {
      navigator.share({
        title: theme.name,
        text: `Check out this ${theme.is_dark_mode ? 'dark' : 'light'} theme`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      this.notificationService.success('Theme link copied to clipboard');
    }
  }

  analyzeAccessibility(theme: Theme): void {
    this.contrastChecks = [
      this.checkContrast('Primary on Background', theme.primary_color, theme.background_color),
      this.checkContrast('Text on Background', theme.text_color, theme.background_color),
      this.checkContrast('Text on Primary', theme.text_color, theme.primary_color),
      this.checkContrast('Accent on Background', theme.accent_color, theme.background_color),
      this.checkContrast('White on Primary', '#FFFFFF', theme.primary_color),
      this.checkContrast('White on Accent', '#FFFFFF', theme.accent_color)
    ];
    this.showAccessibilityReport = true;
  }

  closeAccessibilityReport(): void {
    this.showAccessibilityReport = false;
  }

  private checkContrast(name: string, foreground: string, background: string): ContrastCheck {
    const ratio = this.calculateContrastRatio(foreground, background);
    const ratioValue = parseFloat(ratio);

    return {
      name,
      foreground,
      background,
      ratio,
      passesAA: ratioValue >= 4.5, // WCAG AA for normal text
      passesAAA: ratioValue >= 7.0  // WCAG AAA for normal text
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

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  getContrastColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  generateColorHarmonies(): void {
    this.colorHarmonies = [
      {
        name: 'Complementary',
        colors: ['#2196F3', '#FF9800'],
        description: 'Colors opposite on the color wheel'
      },
      {
        name: 'Analogous',
        colors: ['#2196F3', '#00BCD4', '#4CAF50'],
        description: 'Colors next to each other'
      },
      {
        name: 'Triadic',
        colors: ['#2196F3', '#FFC107', '#E91E63'],
        description: 'Three colors evenly spaced'
      },
      {
        name: 'Split Complementary',
        colors: ['#2196F3', '#FF5722', '#FFEB3B'],
        description: 'A color and two adjacent to its complement'
      },
      {
        name: 'Monochromatic',
        colors: ['#E3F2FD', '#64B5F6', '#2196F3', '#1976D2'],
        description: 'Different shades of the same color'
      }
    ];
  }

  applyHarmony(harmony: ColorHarmony): void {
    const newTheme = {
      name: `${harmony.name} Theme`,
      primary_color: harmony.colors[0],
      accent_color: harmony.colors[1] || harmony.colors[0],
      background_color: '#FFFFFF',
      text_color: '#212121',
      font_family: 'Roboto',
      is_dark_mode: false
    };

    this.themeService.createTheme(newTheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (theme) => {
          this.router.navigate(['/themes', theme.id]);
        },
        error: (error) => {
          console.error('Failed to create harmony theme:', error);
          this.notificationService.error('Failed to create theme');
        }
      });
  }

  toggleMenu(theme: Theme): void {
    this.menuOpenFor = this.menuOpenFor === theme.id ? null : theme.id;
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes === 0 ? 'just now' : `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
