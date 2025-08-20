// src/app/core/services/canvas.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Widget } from '../models/widget.model';

export interface CanvasState {
  zoom: number;
  deviceType: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  selectedWidgetId: number | null;
  hoveredWidgetId: number | null;
  isDragging: boolean;
  isResizing: boolean;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

@Injectable({ providedIn: 'root' })
export class CanvasService {
  private canvasStateSubject = new BehaviorSubject<CanvasState>({
    zoom: 100,
    deviceType: 'iphone14',
    gridEnabled: false,
    snapToGrid: true,
    showRulers: false,
    selectedWidgetId: null,
    hoveredWidgetId: null,
    isDragging: false,
    isResizing: false
  });

  public canvasState$ = this.canvasStateSubject.asObservable();

  private viewportDimensionsSubject = new BehaviorSubject<ViewportDimensions>({
    width: 375,
    height: 812
  });

  public viewportDimensions$ = this.viewportDimensionsSubject.asObservable();

  constructor() {}

  get canvasState(): CanvasState {
    return this.canvasStateSubject.value;
  }

  get viewportDimensions(): ViewportDimensions {
    return this.viewportDimensionsSubject.value;
  }

  setZoom(zoom: number): void {
    const clampedZoom = Math.max(25, Math.min(200, zoom));
    this.updateState({ zoom: clampedZoom });
  }

  setDeviceType(deviceType: string): void {
    this.updateState({ deviceType });
    this.updateViewportDimensions(deviceType);
  }

  toggleGrid(): void {
    this.updateState({ gridEnabled: !this.canvasState.gridEnabled });
  }

  toggleSnapToGrid(): void {
    this.updateState({ snapToGrid: !this.canvasState.snapToGrid });
  }

  toggleRulers(): void {
    this.updateState({ showRulers: !this.canvasState.showRulers });
  }

  setSelectedWidget(widgetId: number | null): void {
    this.updateState({ selectedWidgetId: widgetId });
  }

  setHoveredWidget(widgetId: number | null): void {
    this.updateState({ hoveredWidgetId: widgetId });
  }

  setDragging(isDragging: boolean): void {
    this.updateState({ isDragging });
  }

  setResizing(isResizing: boolean): void {
    this.updateState({ isResizing });
  }

  private updateState(partial: Partial<CanvasState>): void {
    this.canvasStateSubject.next({
      ...this.canvasState,
      ...partial
    });
  }

  private updateViewportDimensions(deviceType: string): void {
    const dimensions = this.getDeviceDimensions(deviceType);
    this.viewportDimensionsSubject.next(dimensions);
  }

  private getDeviceDimensions(deviceType: string): ViewportDimensions {
    const devices: Record<string, ViewportDimensions> = {
      'iphone14': { width: 390, height: 844 },
      'iphone14pro': { width: 393, height: 852 },
      'iphone14promax': { width: 430, height: 932 },
      'iphonese': { width: 375, height: 667 },
      'ipadmini': { width: 744, height: 1133 },
      'ipadpro': { width: 1024, height: 1366 },
      'pixel7': { width: 412, height: 915 },
      'galaxys22': { width: 360, height: 780 },
      'android': { width: 360, height: 800 },
      'custom': { width: 375, height: 812 }
    };

    return devices[deviceType] || devices['custom'];
  }

  // Snap to grid functionality
  snapToGrid(value: number, gridSize: number = 8): number {
    if (!this.canvasState.snapToGrid) {
      return value;
    }
    return Math.round(value / gridSize) * gridSize;
  }

  // Convert screen coordinates to canvas coordinates
  screenToCanvas(x: number, y: number, canvasRect: DOMRect): { x: number; y: number } {
    const zoom = this.canvasState.zoom / 100;
    return {
      x: (x - canvasRect.left) / zoom,
      y: (y - canvasRect.top) / zoom
    };
  }

  // Convert canvas coordinates to screen coordinates
  canvasToScreen(x: number, y: number, canvasRect: DOMRect): { x: number; y: number } {
    const zoom = this.canvasState.zoom / 100;
    return {
      x: x * zoom + canvasRect.left,
      y: y * zoom + canvasRect.top
    };
  }

  // Check if a point is inside a widget
  isPointInsideWidget(point: { x: number; y: number }, widget: Widget, element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return point.x >= rect.left &&
           point.x <= rect.right &&
           point.y >= rect.top &&
           point.y <= rect.bottom;
  }

  // Get the nearest edge for resize handles
  getNearestEdge(point: { x: number; y: number }, element: HTMLElement, threshold: number = 10): string | null {
    const rect = element.getBoundingClientRect();
    const edges = [];

    if (Math.abs(point.x - rect.left) < threshold) edges.push('left');
    if (Math.abs(point.x - rect.right) < threshold) edges.push('right');
    if (Math.abs(point.y - rect.top) < threshold) edges.push('top');
    if (Math.abs(point.y - rect.bottom) < threshold) edges.push('bottom');

    if (edges.length === 2) {
      return `${edges[1]}-${edges[0]}`;
    } else if (edges.length === 1) {
      return edges[0];
    }

    return null;
  }
}
