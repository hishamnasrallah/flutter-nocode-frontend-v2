// src/app/shared/components/color-picker/color-picker.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorUtils } from '../../../core/utils/color-utils';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="color-picker-container">
      <!-- Color Preview Button -->
      <div class="color-preview-button" (click)="togglePicker()" [style.background-color]="value">
        <div class="color-display" [style.background-color]="value"></div>
        <span class="color-value">{{ value || '#000000' }}</span>
        <span class="material-icons dropdown-icon">{{ isOpen ? 'expand_less' : 'expand_more' }}</span>
      </div>

      <!-- Color Picker Dropdown -->
      <div class="color-picker-dropdown" *ngIf="isOpen" [@slideIn]>
        <!-- Tab Navigation -->
        <div class="picker-tabs">
          <button
            class="tab-button"
            [class.active]="activeTab === 'swatches'"
            (click)="activeTab = 'swatches'">
            Swatches
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'custom'"
            (click)="activeTab = 'custom'">
            Custom
          </button>
          <button
            class="tab-button"
            [class.active]="activeTab === 'gradient'"
            (click)="activeTab = 'gradient'"
            *ngIf="allowGradient">
            Gradient
          </button>
        </div>

        <!-- Swatches Tab -->
        <div class="tab-content" *ngIf="activeTab === 'swatches'">
          <!-- Recent Colors -->
          <div class="color-section" *ngIf="recentColors.length > 0">
            <label class="section-label">Recent</label>
            <div class="color-grid">
              <div
                class="color-swatch"
                *ngFor="let color of recentColors"
                [style.background-color]="color"
                [class.selected]="value === color"
                (click)="selectColor(color)"
                [title]="color">
              </div>
            </div>
          </div>

          <!-- Material Colors -->
          <div class="color-section">
            <label class="section-label">Material Colors</label>
            <div class="color-grid">
              <div
                class="color-swatch"
                *ngFor="let color of materialColors"
                [style.background-color]="color"
                [class.selected]="value === color"
                (click)="selectColor(color)"
                [title]="color">
                <span class="check-icon material-icons" *ngIf="value === color">check</span>
              </div>
            </div>
          </div>

          <!-- Theme Colors -->
          <div class="color-section" *ngIf="themeColors.length > 0">
            <label class="section-label">Theme</label>
            <div class="color-grid">
              <div
                class="color-swatch"
                *ngFor="let color of themeColors"
                [style.background-color]="color"
                [class.selected]="value === color"
                (click)="selectColor(color)"
                [title]="color">
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Tab -->
        <div class="tab-content" *ngIf="activeTab === 'custom'">
          <!-- Color Sliders -->
          <div class="color-sliders">
            <!-- Hue Slider -->
            <div class="slider-group">
              <label>Hue</label>
              <input
                type="range"
                min="0"
                max="360"
                [(ngModel)]="hue"
                (ngModelChange)="updateFromHSL()"
                class="hue-slider">
              <span class="slider-value">{{ hue }}°</span>
            </div>

            <!-- Saturation Slider -->
            <div class="slider-group">
              <label>Saturation</label>
              <input
                type="range"
                min="0"
                max="100"
                [(ngModel)]="saturation"
                (ngModelChange)="updateFromHSL()"
                class="saturation-slider">
              <span class="slider-value">{{ saturation }}%</span>
            </div>

            <!-- Lightness Slider -->
            <div class="slider-group">
              <label>Lightness</label>
              <input
                type="range"
                min="0"
                max="100"
                [(ngModel)]="lightness"
                (ngModelChange)="updateFromHSL()"
                class="lightness-slider">
              <span class="slider-value">{{ lightness }}%</span>
            </div>

            <!-- Opacity Slider -->
            <div class="slider-group" *ngIf="allowOpacity">
              <label>Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                [(ngModel)]="opacity"
                (ngModelChange)="updateFromHSL()"
                class="opacity-slider">
              <span class="slider-value">{{ opacity }}%</span>
            </div>
          </div>

          <!-- Color Input Fields -->
          <div class="color-inputs">
            <div class="input-group">
              <label>Hex</label>
              <input
                type="text"
                [(ngModel)]="hexInput"
                (blur)="onHexInput()"
                maxlength="7"
                placeholder="#000000">
            </div>

            <div class="input-row">
              <div class="input-group">
                <label>R</label>
                <input
                  type="number"
                  [(ngModel)]="rgb.r"
                  (ngModelChange)="updateFromRGB()"
                  min="0"
                  max="255">
              </div>
              <div class="input-group">
                <label>G</label>
                <input
                  type="number"
                  [(ngModel)]="rgb.g"
                  (ngModelChange)="updateFromRGB()"
                  min="0"
                  max="255">
              </div>
              <div class="input-group">
                <label>B</label>
                <input
                  type="number"
                  [(ngModel)]="rgb.b"
                  (ngModelChange)="updateFromRGB()"
                  min="0"
                  max="255">
              </div>
            </div>
          </div>

          <!-- Native Color Picker -->
          <div class="native-picker">
            <input
              type="color"
              [(ngModel)]="value"
              (ngModelChange)="onColorChange()"
              class="native-color-input">
            <label>Use system color picker</label>
          </div>
        </div>

        <!-- Gradient Tab -->
        <div class="tab-content" *ngIf="activeTab === 'gradient' && allowGradient">
          <div class="gradient-builder">
            <div class="gradient-preview" [style.background]="gradientValue"></div>

            <div class="gradient-stops">
              <div class="gradient-stop" *ngFor="let stop of gradientStops; let i = index">
                <input
                  type="color"
                  [(ngModel)]="stop.color"
                  (ngModelChange)="updateGradient()">
                <input
                  type="number"
                  [(ngModel)]="stop.position"
                  (ngModelChange)="updateGradient()"
                  min="0"
                  max="100"
                  class="position-input">
                <span>%</span>
                <button class="remove-stop" (click)="removeGradientStop(i)" *ngIf="gradientStops.length > 2">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <button class="add-stop-btn" (click)="addGradientStop()">
              <span class="material-icons">add</span>
              Add Stop
            </button>

            <div class="gradient-direction">
              <label>Direction</label>
              <select [(ngModel)]="gradientDirection" (ngModelChange)="updateGradient()">
                <option value="to right">Horizontal →</option>
                <option value="to left">Horizontal ←</option>
                <option value="to bottom">Vertical ↓</option>
                <option value="to top">Vertical ↑</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to bottom left">Diagonal ↙</option>
                <option value="to top right">Diagonal ↗</option>
                <option value="to top left">Diagonal ↖</option>
                <option value="circle">Radial</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="picker-actions">
          <button class="action-btn" (click)="clearColor()">Clear</button>
          <button class="action-btn primary" (click)="applyColor()">Apply</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {
  @Input() value: string = '#000000';
  @Input() allowOpacity: boolean = false;
  @Input() allowGradient: boolean = false;
  @Input() themeColors: string[] = [];
  @Input() label: string = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() onApply = new EventEmitter<string>();

  isOpen = false;
  activeTab: 'swatches' | 'custom' | 'gradient' = 'swatches';

  // Color values
  hexInput = '#000000';
  rgb = { r: 0, g: 0, b: 0 };
  hue = 0;
  saturation = 0;
  lightness = 0;
  opacity = 100;

  // Gradient
  gradientStops = [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 }
  ];
  gradientDirection = 'to right';
  gradientValue = '';

  // Color lists
  recentColors: string[] = [];
  materialColors = ColorUtils.getMaterialColors();

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.updateColorValues();
    this.loadRecentColors();
    if (this.allowGradient) {
      this.updateGradient();
    }
  }

  ngOnChanges(): void {
    this.updateColorValues();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  togglePicker(): void {
    this.isOpen = !this.isOpen;
  }

  selectColor(color: string): void {
    this.value = color;
    this.updateColorValues();
    this.valueChange.emit(color);
    this.addToRecentColors(color);
  }

  updateColorValues(): void {
    if (!this.value) return;

    this.hexInput = this.value;
    this.rgb = ColorUtils.hexToRgb(this.value);

    // Convert to HSL
    const r = this.rgb.r / 255;
    const g = this.rgb.g / 255;
    const b = this.rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) {
      this.hue = 0;
      this.saturation = 0;
    } else {
      const d = max - min;
      this.saturation = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          this.hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          this.hue = ((b - r) / d + 2) / 6;
          break;
        case b:
          this.hue = ((r - g) / d + 4) / 6;
          break;
      }
    }

    this.hue = Math.round(this.hue * 360);
    this.saturation = Math.round(this.saturation * 100);
    this.lightness = Math.round(l * 100);
  }

  updateFromHSL(): void {
    const h = this.hue / 360;
    const s = this.saturation / 100;
    const l = this.lightness / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    this.rgb = {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };

    this.value = ColorUtils.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    this.hexInput = this.value;
    this.valueChange.emit(this.value);
  }

  updateFromRGB(): void {
    this.value = ColorUtils.rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    this.hexInput = this.value;
    this.updateColorValues();
    this.valueChange.emit(this.value);
  }

  onHexInput(): void {
    if (ColorUtils.isValidHex(this.hexInput)) {
      this.value = this.hexInput;
      this.updateColorValues();
      this.valueChange.emit(this.value);
    }
  }

  onColorChange(): void {
    this.updateColorValues();
    this.valueChange.emit(this.value);
  }

  updateGradient(): void {
    const stops = this.gradientStops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (this.gradientDirection === 'circle') {
      this.gradientValue = `radial-gradient(${stops})`;
    } else {
      this.gradientValue = `linear-gradient(${this.gradientDirection}, ${stops})`;
    }
  }

  addGradientStop(): void {
    const lastPosition = this.gradientStops[this.gradientStops.length - 1].position;
    this.gradientStops.push({
      color: '#000000',
      position: Math.min(lastPosition + 10, 100)
    });
    this.updateGradient();
  }

  removeGradientStop(index: number): void {
    this.gradientStops.splice(index, 1);
    this.updateGradient();
  }

  clearColor(): void {
    this.value = '';
    this.valueChange.emit('');
    this.isOpen = false;
  }

  applyColor(): void {
    if (this.activeTab === 'gradient' && this.allowGradient) {
      this.onApply.emit(this.gradientValue);
    } else {
      this.onApply.emit(this.value);
      this.addToRecentColors(this.value);
    }
    this.isOpen = false;
  }

  private addToRecentColors(color: string): void {
    if (!color) return;

    const index = this.recentColors.indexOf(color);
    if (index > -1) {
      this.recentColors.splice(index, 1);
    }

    this.recentColors.unshift(color);
    if (this.recentColors.length > 8) {
      this.recentColors.pop();
    }

    localStorage.setItem('recentColors', JSON.stringify(this.recentColors));
  }

  private loadRecentColors(): void {
    const stored = localStorage.getItem('recentColors');
    if (stored) {
      try {
        this.recentColors = JSON.parse(stored);
      } catch {}
    }
  }
}
