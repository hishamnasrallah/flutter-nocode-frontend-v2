// src/app/features/builder/preview/preview.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { DeviceFrameComponent } from '../device-frame/device-frame.component';
import { PreviewService } from '../../../core/services/preview.service';
import { Application } from '../../../core/models/application.model';
import { Screen } from '../../../core/models/screen.model';
import { Widget } from '../../../core/models/widget.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceFrameComponent],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class PreviewComponent implements OnInit, OnDestroy {
  @Input() application: Application | null = null;
  @Input() screen: Screen | null = null;
  @Input() widgets: Widget[] = [];
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  currentDevice = 'iphone14';
  currentZoom = 100;
  orientation: 'portrait' | 'landscape' = 'portrait';
  hotReloadEnabled = true;

  // Device list for selector
  availableDevices = [
    { id: 'iphone14', name: 'iPhone 14', icon: 'phone_iphone' },
    { id: 'iphone14pro', name: 'iPhone 14 Pro', icon: 'phone_iphone' },
    { id: 'iphonese', name: 'iPhone SE', icon: 'phone_iphone' },
    { id: 'android', name: 'Android', icon: 'phone_android' },
    { id: 'ipad', name: 'iPad', icon: 'tablet_mac' }
  ];

  // Zoom presets
  zoomPresets = [25, 50, 75, 100, 125, 150, 200];

  constructor(private previewService: PreviewService) {}

  ngOnInit(): void {
    // Enter preview mode
    this.previewService.enterPreviewMode();

    // Subscribe to hot reload changes
    this.previewService.hotReload$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        this.hotReloadEnabled = enabled;
        if (enabled) {
          this.refreshPreview();
        }
      });

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    // Exit preview mode
    this.previewService.exitPreviewMode();

    // Restore body scroll
    document.body.style.overflow = '';

    // Cleanup
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectDevice(deviceId: string): void {
    this.currentDevice = deviceId;

    // Adjust zoom for larger devices
    if (deviceId === 'ipad' && this.currentZoom > 100) {
      this.currentZoom = 75;
    }
  }

  toggleOrientation(): void {
    this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
  }

  onZoomChange(): void {
    // Zoom already bound via ngModel
  }

  increaseZoom(): void {
    const currentIndex = this.zoomPresets.indexOf(this.currentZoom);
    if (currentIndex < this.zoomPresets.length - 1) {
      this.currentZoom = this.zoomPresets[currentIndex + 1];
    }
  }

  decreaseZoom(): void {
    const currentIndex = this.zoomPresets.indexOf(this.currentZoom);
    if (currentIndex > 0) {
      this.currentZoom = this.zoomPresets[currentIndex - 1];
    }
  }

  resetZoom(): void {
    this.currentZoom = 100;
  }

  toggleHotReload(): void {
    this.previewService.toggleHotReload();
  }

  refreshPreview(): void {
    this.previewService.refreshPreview();

    // Add visual feedback
    const content = document.querySelector('.app-preview-content');
    if (content) {
      content.classList.add('refreshing');
      setTimeout(() => {
        content.classList.remove('refreshing');
      }, 300);
    }
  }

  sharePreview(): void {
    if (navigator.share) {
      navigator.share({
        title: this.application?.name || 'Flutter App Preview',
        text: `Check out my Flutter app: ${this.application?.name}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log('Link copied to clipboard');
    }
  }

  async downloadScreenshot(): Promise<void> {
    try {
      // Use html2canvas or similar library to capture screenshot
      const deviceFrame = document.querySelector('.device-frame-container') as HTMLElement;
      if (deviceFrame) {
        // Implement screenshot logic here
        console.log('Screenshot functionality to be implemented');

        // For now, just log
        alert('Screenshot feature coming soon!');
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  private setupKeyboardShortcuts(): void {
    const handleKeydown = (event: KeyboardEvent) => {
      // ESC to close
      if (event.key === 'Escape') {
        this.onClose();
      }

      // Cmd/Ctrl + R to refresh
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        this.refreshPreview();
      }

      // Cmd/Ctrl + '+' to zoom in
      if ((event.metaKey || event.ctrlKey) && event.key === '+') {
        event.preventDefault();
        this.increaseZoom();
      }

      // Cmd/Ctrl + '-' to zoom out
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault();
        this.decreaseZoom();
      }

      // Cmd/Ctrl + 0 to reset zoom
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        this.resetZoom();
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Cleanup on destroy
    this.destroy$.subscribe(() => {
      document.removeEventListener('keydown', handleKeydown);
    });
  }
}
