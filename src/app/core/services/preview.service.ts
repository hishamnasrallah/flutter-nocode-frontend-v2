// src/app/core/services/preview.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private previewModeSubject = new BehaviorSubject<boolean>(false);
  public previewMode$ = this.previewModeSubject.asObservable();

  private hotReloadSubject = new BehaviorSubject<boolean>(true);
  public hotReload$ = this.hotReloadSubject.asObservable();

  private refreshSubject = new Subject<void>();
  public refresh$ = this.refreshSubject.asObservable();

  private deviceOrientationSubject = new BehaviorSubject<'portrait' | 'landscape'>('portrait');
  public deviceOrientation$ = this.deviceOrientationSubject.asObservable();

  private selectedDeviceSubject = new BehaviorSubject<string>('iphone14');
  public selectedDevice$ = this.selectedDeviceSubject.asObservable();

  private zoomLevelSubject = new BehaviorSubject<number>(100);
  public zoomLevel$ = this.zoomLevelSubject.asObservable();

  // Preview history for navigation
  private navigationHistory: string[] = [];
  private currentNavigationIndex = -1;

  constructor() {
    // Load saved preferences
    this.loadPreferences();
  }

  enterPreviewMode(): void {
    this.previewModeSubject.next(true);

    // Save current state
    sessionStorage.setItem('previewMode', 'true');

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('preview-mode-enter'));
  }

  exitPreviewMode(): void {
    this.previewModeSubject.next(false);

    // Clear saved state
    sessionStorage.removeItem('previewMode');

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('preview-mode-exit'));
  }

  toggleHotReload(): void {
    const currentValue = this.hotReloadSubject.value;
    const newValue = !currentValue;

    this.hotReloadSubject.next(newValue);

    // Save preference
    localStorage.setItem('preview_hotReload', String(newValue));

    if (newValue) {
      this.startHotReloadWatcher();
    } else {
      this.stopHotReloadWatcher();
    }
  }

  refreshPreview(): void {
    this.refreshSubject.next();

    // Log refresh event
    console.log('[Preview] Manual refresh triggered');
  }

  setDevice(deviceId: string): void {
    this.selectedDeviceSubject.next(deviceId);
    localStorage.setItem('preview_device', deviceId);
  }

  setOrientation(orientation: 'portrait' | 'landscape'): void {
    this.deviceOrientationSubject.next(orientation);
    localStorage.setItem('preview_orientation', orientation);
  }

  setZoomLevel(zoom: number): void {
    // Clamp zoom between 25 and 200
    const clampedZoom = Math.max(25, Math.min(200, zoom));
    this.zoomLevelSubject.next(clampedZoom);
    localStorage.setItem('preview_zoom', String(clampedZoom));
  }

  // Navigation methods for preview
  navigateToScreen(screenRoute: string): void {
    if (this.currentNavigationIndex < this.navigationHistory.length - 1) {
      // Remove forward history
      this.navigationHistory = this.navigationHistory.slice(0, this.currentNavigationIndex + 1);
    }

    this.navigationHistory.push(screenRoute);
    this.currentNavigationIndex++;

    // Limit history size
    if (this.navigationHistory.length > 50) {
      this.navigationHistory = this.navigationHistory.slice(-50);
      this.currentNavigationIndex = this.navigationHistory.length - 1;
    }
  }

  canGoBack(): boolean {
    return this.currentNavigationIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentNavigationIndex < this.navigationHistory.length - 1;
  }

  goBack(): string | null {
    if (this.canGoBack()) {
      this.currentNavigationIndex--;
      return this.navigationHistory[this.currentNavigationIndex];
    }
    return null;
  }

  goForward(): string | null {
    if (this.canGoForward()) {
      this.currentNavigationIndex++;
      return this.navigationHistory[this.currentNavigationIndex];
    }
    return null;
  }

  clearNavigationHistory(): void {
    this.navigationHistory = [];
    this.currentNavigationIndex = -1;
  }

  // Hot reload watcher
  private hotReloadInterval: any;

  private startHotReloadWatcher(): void {
    // In production, this would connect to a WebSocket
    // For now, simulate with interval
    this.hotReloadInterval = setInterval(() => {
      // Check for changes (mock)
      const hasChanges = this.checkForChanges();
      if (hasChanges) {
        this.refreshSubject.next();
        console.log('[Hot Reload] Changes detected, refreshing preview');
      }
    }, 2000);
  }

  private stopHotReloadWatcher(): void {
    if (this.hotReloadInterval) {
      clearInterval(this.hotReloadInterval);
      this.hotReloadInterval = null;
    }
  }

  private checkForChanges(): boolean {
    // Mock implementation
    // In production, this would check actual widget/property changes
    return Math.random() > 0.95; // 5% chance of change for demo
  }

  private loadPreferences(): void {
    // Load saved preferences
    const hotReload = localStorage.getItem('preview_hotReload');
    if (hotReload !== null) {
      this.hotReloadSubject.next(hotReload === 'true');
    }

    const device = localStorage.getItem('preview_device');
    if (device) {
      this.selectedDeviceSubject.next(device);
    }

    const orientation = localStorage.getItem('preview_orientation');
    if (orientation === 'portrait' || orientation === 'landscape') {
      this.deviceOrientationSubject.next(orientation);
    }

    const zoom = localStorage.getItem('preview_zoom');
    if (zoom) {
      const zoomValue = parseInt(zoom, 10);
      if (!isNaN(zoomValue)) {
        this.setZoomLevel(zoomValue);
      }
    }
  }

  // Screenshot functionality
  async captureScreenshot(): Promise<Blob | null> {
    try {
      // This would use a library like html2canvas
      // For now, return null as placeholder
      console.log('[Preview] Screenshot capture requested');
      return null;
    } catch (error) {
      console.error('[Preview] Screenshot capture failed:', error);
      return null;
    }
  }

  // Export preview as standalone HTML
  exportAsHTML(): string {
    // Generate standalone HTML with inline styles
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flutter App Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .preview-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    /* Add more styles as needed */
  </style>
</head>
<body>
  <div class="preview-container">
    <!-- Preview content here -->
    <h1>Flutter App Preview</h1>
    <p>Preview content would be rendered here</p>
  </div>
</body>
</html>`;

    return html;
  }

  // Share preview link
  generateShareableLink(): string {
    // Generate a shareable link for the preview
    const baseUrl = window.location.origin;
    const previewId = this.generatePreviewId();
    return `${baseUrl}/preview/${previewId}`;
  }

  private generatePreviewId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
