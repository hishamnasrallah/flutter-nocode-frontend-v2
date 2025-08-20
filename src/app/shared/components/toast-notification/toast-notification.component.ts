// src/app/shared/components/toast-notification/toast-notification.component.ts

import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewEncapsulation,
  HostListener,
  Renderer2,
  Inject,
  Optional
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationEvent
} from '@angular/animations';
import { Subject, Subscription, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface ToastConfig {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  showProgress?: boolean;
  position?: ToastPosition;
  pauseOnHover?: boolean;
  preventDuplicates?: boolean;
  data?: any;
}

export interface Toast extends Required<Omit<ToastConfig, 'action' | 'data' | 'title'>> {
  id: string;
  title?: string;
  action?: ToastAction;
  data?: any;
  timestamp: number;
  state: 'queued' | 'visible' | 'removing';
  swipeOffset: number;
  timer?: Subscription;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('slideIn', [
      // Enter animations
      state('in-right', style({ transform: 'translateX(0)', opacity: 1 })),
      state('in-left', style({ transform: 'translateX(0)', opacity: 1 })),
      state('in-top', style({ transform: 'translateY(0)', opacity: 1 })),
      state('in-bottom', style({ transform: 'translateY(0)', opacity: 1 })),

      // Exit animations
      state('out-right', style({ transform: 'translateX(110%)', opacity: 0 })),
      state('out-left', style({ transform: 'translateX(-110%)', opacity: 0 })),
      state('out-top', style({ transform: 'translateY(-110%)', opacity: 0 })),
      state('out-bottom', style({ transform: 'translateY(110%)', opacity: 0 })),

      // Transitions
      transition('void => in-right', [
        style({ transform: 'translateX(110%)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('in-right => out-right', animate('200ms ease-in')),

      transition('void => in-left', [
        style({ transform: 'translateX(-110%)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('in-left => out-left', animate('200ms ease-in')),

      transition('void => in-top', [
        style({ transform: 'translateY(-110%)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('in-top => out-top', animate('200ms ease-in')),

      transition('void => in-bottom', [
        style({ transform: 'translateY(110%)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('in-bottom => out-bottom', animate('200ms ease-in'))
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  @Input() position: ToastPosition = 'top-right';
  @Input() maxToasts: number = 5;
  @Input() defaultDuration: number = 5000;
  @Input() stackSpacing: number = 12;
  @Input() ariaLive: 'polite' | 'assertive' = 'polite';
  @Input() renderPortal: boolean = false;

  visibleToasts: Toast[] = [];
  queuedToasts: Toast[] = [];
  isMobile: boolean = false;
  Math = Math;

  private destroy$ = new Subject<void>();
  private toastCounter = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private swipeThreshold = 100;
  private swipeVelocityThreshold = 0.3;
  private portalElement?: HTMLElement;

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    @Optional() @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.checkMobileDevice();
    this.setupPortal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearAllToasts();
    this.cleanupPortal();
  }

  // Public API Methods
  show(config: ToastConfig | string): string {
    const toastConfig: ToastConfig = typeof config === 'string'
      ? { message: config }
      : config;

    // Check for duplicates if enabled
    if (toastConfig.preventDuplicates) {
      const duplicate = [...this.visibleToasts, ...this.queuedToasts]
        .find(t => t.message === toastConfig.message && t.type === (toastConfig.type || 'default'));

      if (duplicate) {
        return duplicate.id;
      }
    }

    const toast: Toast = {
      id: toastConfig.id || this.generateToastId(),
      type: toastConfig.type || 'default',
      title: toastConfig.title,
      message: toastConfig.message,
      duration: toastConfig.duration ?? this.defaultDuration,
      dismissible: toastConfig.dismissible ?? true,
      action: toastConfig.action,
      showProgress: toastConfig.showProgress ?? true,
      position: toastConfig.position || this.position,
      pauseOnHover: toastConfig.pauseOnHover ?? true,
      preventDuplicates: toastConfig.preventDuplicates ?? false,
      data: toastConfig.data,
      timestamp: Date.now(),
      state: 'queued',
      swipeOffset: 0
    };

    if (this.visibleToasts.length < this.maxToasts) {
      this.showToast(toast);
    } else {
      this.queuedToasts.push(toast);
    }

    this.cdr.detectChanges();
    return toast.id;
  }

  success(message: string, title?: string, config?: Partial<ToastConfig>): string {
    return this.show({ ...config, message, title, type: 'success' });
  }

  error(message: string, title?: string, config?: Partial<ToastConfig>): string {
    return this.show({ ...config, message, title, type: 'error' });
  }

  warning(message: string, title?: string, config?: Partial<ToastConfig>): string {
    return this.show({ ...config, message, title, type: 'warning' });
  }

  info(message: string, title?: string, config?: Partial<ToastConfig>): string {
    return this.show({ ...config, message, title, type: 'info' });
  }

  remove(id: string): void {
    const toast = this.visibleToasts.find(t => t.id === id);
    if (toast) {
      this.removeToast(toast);
    } else {
      // Remove from queue
      this.queuedToasts = this.queuedToasts.filter(t => t.id !== id);
    }
  }

  clear(): void {
    this.visibleToasts.forEach(toast => this.removeToast(toast));
    this.queuedToasts = [];
  }

  clearByType(type: ToastType): void {
    this.visibleToasts
      .filter(t => t.type === type)
      .forEach(toast => this.removeToast(toast));

    this.queuedToasts = this.queuedToasts.filter(t => t.type !== type);
  }

  // Private Methods
  private showToast(toast: Toast): void {
    toast.state = 'visible';
    this.visibleToasts.push(toast);

    // Set up auto-dismiss timer
    if (toast.duration > 0) {
      this.startToastTimer(toast);
    }
  }

  private startToastTimer(toast: Toast): void {
    if (toast.timer) {
      toast.timer.unsubscribe();
    }

    toast.timer = timer(toast.duration)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.removeToast(toast);
      });
  }

  private pauseToastTimer(toast: Toast): void {
    if (toast.timer && toast.pauseOnHover) {
      toast.timer.unsubscribe();
      toast.timer = undefined;
    }
  }

  private resumeToastTimer(toast: Toast): void {
    if (!toast.timer && toast.duration > 0 && toast.pauseOnHover) {
      // Resume with remaining time (simplified - could track actual remaining time)
      this.startToastTimer(toast);
    }
  }

  private removeToast(toast: Toast): void {
    toast.state = 'removing';

    if (toast.timer) {
      toast.timer.unsubscribe();
    }

    // Wait for animation to complete
    setTimeout(() => {
      this.visibleToasts = this.visibleToasts.filter(t => t.id !== toast.id);

      // Show next queued toast
      if (this.queuedToasts.length > 0) {
        const nextToast = this.queuedToasts.shift();
        if (nextToast) {
          this.showToast(nextToast);
        }
      }

      this.cdr.detectChanges();
    }, 200);
  }

  private clearAllToasts(): void {
    this.visibleToasts.forEach(toast => {
      if (toast.timer) {
        toast.timer.unsubscribe();
      }
    });
    this.visibleToasts = [];
    this.queuedToasts = [];
  }

  // Event Handlers
  onToastClick(toast: Toast): void {
    if (toast.dismissible && !toast.action) {
      this.removeToast(toast);
    }
  }

  onActionClick(event: MouseEvent, toast: Toast): void {
    event.stopPropagation();
    if (toast.action) {
      toast.action.callback();
      this.removeToast(toast);
    }
  }

  onCloseClick(event: MouseEvent, toast: Toast): void {
    event.stopPropagation();
    this.removeToast(toast);
  }

  onAnimationDone(event: AnimationEvent, toast: Toast): void {
    if (event.toState?.startsWith('out-')) {
      this.visibleToasts = this.visibleToasts.filter(t => t.id !== toast.id);
    }
  }

  // Touch/Swipe Handlers
  onTouchStart(event: TouchEvent, toast: Toast): void {
    if (!toast.dismissible || !this.isMobile) return;

    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();

    this.pauseToastTimer(toast);
  }

  onTouchMove(event: TouchEvent, toast: Toast): void {
    if (!toast.dismissible || !this.isMobile) return;

    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);

    // Only swipe horizontally
    if (Math.abs(deltaX) > deltaY) {
      event.preventDefault();
      toast.swipeOffset = deltaX;
      this.cdr.detectChanges();
    }
  }

  onTouchEnd(event: TouchEvent, toast: Toast): void {
    if (!toast.dismissible || !this.isMobile) return;

    const deltaTime = Date.now() - this.touchStartTime;
    const velocity = Math.abs(toast.swipeOffset) / deltaTime;

    if (Math.abs(toast.swipeOffset) > this.swipeThreshold ||
        velocity > this.swipeVelocityThreshold) {
      // Complete the swipe
      const direction = toast.swipeOffset > 0 ? 'right' : 'left';
      toast.swipeOffset = direction === 'right' ? 300 : -300;
      this.removeToast(toast);
    } else {
      // Snap back
      toast.swipeOffset = 0;
      this.resumeToastTimer(toast);
    }

    this.cdr.detectChanges();
  }

  // Helper Methods
  getToastIcon(toast: Toast): string {
    const iconMap: Record<ToastType, string> = {
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info',
      'default': 'notifications'
    };
    return iconMap[toast.type];
  }

  getAnimationState(toast: Toast): string {
    const direction = this.getAnimationDirection();
    return toast.state === 'removing' ? `out-${direction}` : `in-${direction}`;
  }

  private getAnimationDirection(): string {
    if (this.position.includes('right')) return 'right';
    if (this.position.includes('left')) return 'left';
    if (this.position.startsWith('top')) return 'top';
    if (this.position.startsWith('bottom')) return 'bottom';
    return 'top';
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  private generateToastId(): string {
    return `toast-${++this.toastCounter}-${Date.now()}`;
  }

  private checkMobileDevice(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent) || window.innerWidth < 768;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkMobileDevice();
  }

  // Portal Support
  private setupPortal(): void {
    if (this.renderPortal && this.document) {
      this.portalElement = this.renderer.createElement('div');
      this.renderer.addClass(this.portalElement, 'toast-notification-portal');
      this.renderer.appendChild(this.document.body, this.portalElement);
    }
  }

  private cleanupPortal(): void {
    if (this.portalElement && this.document) {
      this.renderer.removeChild(this.document.body, this.portalElement);
    }
  }

  // Static factory methods for common toasts
  static createSuccessConfig(message: string, title?: string): ToastConfig {
    return {
      type: 'success',
      title,
      message,
      duration: 5000,
      showProgress: true
    };
  }

  static createErrorConfig(message: string, title?: string): ToastConfig {
    return {
      type: 'error',
      title: title || 'Error',
      message,
      duration: 0, // Don't auto-dismiss errors
      dismissible: true,
      showProgress: false
    };
  }

  static createWarningConfig(message: string, title?: string): ToastConfig {
    return {
      type: 'warning',
      title,
      message,
      duration: 7000,
      showProgress: true
    };
  }

  static createInfoConfig(message: string, title?: string): ToastConfig {
    return {
      type: 'info',
      title,
      message,
      duration: 5000,
      showProgress: true
    };
  }

  static createActionConfig(
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    type: ToastType = 'default'
  ): ToastConfig {
    return {
      type,
      message,
      action: {
        label: actionLabel,
        callback: actionCallback
      },
      duration: 10000,
      dismissible: false,
      showProgress: true
    };
  }
}
