// src/app/shared/components/loading-spinner/loading-spinner.component.ts

import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes
} from '@angular/animations';

export type SpinnerType = 'circular' | 'dots' | 'bars' | 'pulse' | 'wave' | 'grid' | 'progress' | 'custom';
export type SpinnerSize = 'small' | 'medium' | 'large' | 'xlarge';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('rotateIn', [
      transition(':enter', [
        style({ transform: 'rotate(-180deg)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'rotate(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('pulseIn', [
      transition(':enter', [
        animate('600ms ease-out', keyframes([
          style({ transform: 'scale(0)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.1)', opacity: 0.7, offset: 0.5 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class LoadingSpinnerComponent implements OnInit, OnChanges {
  @Input() type: SpinnerType = 'circular';
  @Input() size: SpinnerSize = 'medium';
  @Input() color: string = '#2196F3';
  @Input() textColor?: string;
  @Input() text: string = '';
  @Input() animatedText: boolean = true;
  @Input() overlay: boolean = false;
  @Input() blur: boolean = false;
  @Input() visible: boolean = true;
  @Input() percentage: number = 0;
  @Input() showPercentage: boolean = true;
  @Input() duration: number = 0; // Auto-hide after duration (ms)

  circumference: number = 283; // 2 * PI * 45 (radius)
  strokeDashOffset: number = 283;

  private hideTimeout: any;

  ngOnInit(): void {
    this.updateProgress();
    this.setupAutoHide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['percentage'] || changes['type']) {
      this.updateProgress();
    }

    if (changes['visible'] && this.visible) {
      this.setupAutoHide();
    }

    if (changes['duration']) {
      this.setupAutoHide();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoHide();
  }

  show(): void {
    this.visible = true;
    this.setupAutoHide();
  }

  hide(): void {
    this.visible = false;
    this.clearAutoHide();
  }

  setProgress(percentage: number): void {
    this.percentage = Math.max(0, Math.min(100, percentage));
    this.updateProgress();
  }

  setType(type: SpinnerType): void {
    this.type = type;
  }

  setSize(size: SpinnerSize): void {
    this.size = size;
  }

  setText(text: string): void {
    this.text = text;
  }

  private updateProgress(): void {
    if (this.type === 'progress') {
      const offset = this.circumference - (this.percentage / 100) * this.circumference;
      this.strokeDashOffset = offset;
    }
  }

  private setupAutoHide(): void {
    this.clearAutoHide();

    if (this.duration > 0 && this.visible) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.duration);
    }
  }

  private clearAutoHide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  // Static factory methods for common loading scenarios
  static createDefault(): LoadingSpinnerConfig {
    return {
      type: 'circular',
      size: 'medium',
      color: '#2196F3',
      overlay: false
    };
  }

  static createFullScreen(text?: string): LoadingSpinnerConfig {
    return {
      type: 'circular',
      size: 'large',
      color: '#2196F3',
      overlay: true,
      blur: true,
      text: text || 'Loading...'
    };
  }

  static createProgress(percentage: number, text?: string): LoadingSpinnerConfig {
    return {
      type: 'progress',
      size: 'large',
      color: '#2196F3',
      percentage,
      showPercentage: true,
      text: text || ''
    };
  }

  static createInline(type: SpinnerType = 'dots'): LoadingSpinnerConfig {
    return {
      type,
      size: 'small',
      color: '#2196F3',
      overlay: false
    };
  }
}

export interface LoadingSpinnerConfig {
  type?: SpinnerType;
  size?: SpinnerSize;
  color?: string;
  textColor?: string;
  text?: string;
  animatedText?: boolean;
  overlay?: boolean;
  blur?: boolean;
  visible?: boolean;
  percentage?: number;
  showPercentage?: boolean;
  duration?: number;
}
