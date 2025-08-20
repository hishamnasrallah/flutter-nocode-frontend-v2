// src/app/core/services/drag-drop.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Widget, WidgetType, CONTAINER_WIDGETS } from '../models/widget.model';

export interface DragData {
  type: 'new-widget' | 'existing-widget';
  widgetType?: WidgetType;
  widget?: Widget;
  sourceParentId?: number | null;
  sourceIndex?: number;
}

export interface DropZone {
  element: HTMLElement;
  parentWidgetId: number | null;
  index: number;
  isActive: boolean;
  canAccept: boolean;
}

export interface DragPosition {
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class DragDropService {
  private dragDataSubject = new BehaviorSubject<DragData | null>(null);
  public dragData$ = this.dragDataSubject.asObservable();

  private isDraggingSubject = new BehaviorSubject<boolean>(false);
  public isDragging$ = this.isDraggingSubject.asObservable();

  private dropZonesSubject = new BehaviorSubject<DropZone[]>([]);
  public dropZones$ = this.dropZonesSubject.asObservable();

  private activeDropZoneSubject = new BehaviorSubject<DropZone | null>(null);
  public activeDropZone$ = this.activeDropZoneSubject.asObservable();

  private dragPositionSubject = new BehaviorSubject<DragPosition>({ x: 0, y: 0 });
  public dragPosition$ = this.dragPositionSubject.asObservable();

  private dropIndicatorElement: HTMLElement | null = null;
  private ghostElement: HTMLElement | null = null;

  constructor() {
    this.setupDropIndicator();
  }

  private setupDropIndicator(): void {
    this.dropIndicatorElement = document.createElement('div');
    this.dropIndicatorElement.className = 'drop-indicator';
    this.dropIndicatorElement.style.cssText = `
      position: absolute;
      background: #2196F3;
      opacity: 0;
      pointer-events: none;
      z-index: 10000;
      transition: opacity 0.2s;
    `;
    document.body.appendChild(this.dropIndicatorElement);
  }

  get dragData(): DragData | null {
    return this.dragDataSubject.value;
  }

  get isDragging(): boolean {
    return this.isDraggingSubject.value;
  }

  get activeDropZone(): DropZone | null {
    return this.activeDropZoneSubject.value;
  }

  // Start dragging a new widget from the palette
  startDragNewWidget(widgetType: WidgetType, event: DragEvent): void {
    const dragData: DragData = {
      type: 'new-widget',
      widgetType
    };

    this.dragDataSubject.next(dragData);
    this.isDraggingSubject.next(true);

    // Set drag data for native drag
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', widgetType);

      // Create custom drag image
      this.createGhostElement(widgetType);
      if (this.ghostElement) {
        event.dataTransfer.setDragImage(this.ghostElement, 50, 20);
      }
    }
  }

  // Start dragging an existing widget
  startDragExistingWidget(widget: Widget, event: DragEvent): void {
    const dragData: DragData = {
      type: 'existing-widget',
      widget,
      sourceParentId: widget.parent_widget,
      sourceIndex: widget.order
    };

    this.dragDataSubject.next(dragData);
    this.isDraggingSubject.next(true);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', widget.id.toString());

      // Create custom drag image
      this.createGhostElementForWidget(widget);
      if (this.ghostElement) {
        event.dataTransfer.setDragImage(this.ghostElement, 50, 20);
      }
    }
  }

  // Update drag position
  updateDragPosition(x: number, y: number): void {
    this.dragPositionSubject.next({ x, y });

    // Find active drop zone
    const element = document.elementFromPoint(x, y);
    if (element) {
      const dropZone = this.findDropZone(element as HTMLElement);
      this.setActiveDropZone(dropZone);
    }
  }

  // Register a drop zone
  registerDropZone(element: HTMLElement, parentWidgetId: number | null, index: number): void {
    const dropZones = this.dropZonesSubject.value;
    const existingIndex = dropZones.findIndex(z => z.element === element);

    const dropZone: DropZone = {
      element,
      parentWidgetId,
      index,
      isActive: false,
      canAccept: this.canAcceptDrop(parentWidgetId)
    };

    if (existingIndex >= 0) {
      dropZones[existingIndex] = dropZone;
    } else {
      dropZones.push(dropZone);
    }

    this.dropZonesSubject.next(dropZones);
  }

  // Unregister a drop zone
  unregisterDropZone(element: HTMLElement): void {
    const dropZones = this.dropZonesSubject.value.filter(z => z.element !== element);
    this.dropZonesSubject.next(dropZones);
  }

  // Clear all drop zones
  clearDropZones(): void {
    this.dropZonesSubject.next([]);
    this.activeDropZoneSubject.next(null);
  }

  // Set active drop zone
  setActiveDropZone(dropZone: DropZone | null): void {
    const currentActive = this.activeDropZone;

    if (currentActive && currentActive !== dropZone) {
      currentActive.isActive = false;
      currentActive.element.classList.remove('drop-zone-active');
    }

    if (dropZone && dropZone.canAccept) {
      dropZone.isActive = true;
      dropZone.element.classList.add('drop-zone-active');
      this.showDropIndicator(dropZone);
    } else {
      this.hideDropIndicator();
    }

    this.activeDropZoneSubject.next(dropZone);
  }

  // Show drop indicator
  showDropIndicator(dropZone: DropZone): void {
    if (!this.dropIndicatorElement) return;

    const rect = dropZone.element.getBoundingClientRect();
    const dragData = this.dragData;

    if (!dragData) return;

    // Determine indicator position based on drop zone type
    const isHorizontal = this.isHorizontalContainer(dropZone.parentWidgetId);

    if (isHorizontal) {
      // Vertical line for horizontal containers
      this.dropIndicatorElement.style.left = `${rect.left}px`;
      this.dropIndicatorElement.style.top = `${rect.top}px`;
      this.dropIndicatorElement.style.width = '2px';
      this.dropIndicatorElement.style.height = `${rect.height}px`;
    } else {
      // Horizontal line for vertical containers
      this.dropIndicatorElement.style.left = `${rect.left}px`;
      this.dropIndicatorElement.style.top = `${rect.top}px`;
      this.dropIndicatorElement.style.width = `${rect.width}px`;
      this.dropIndicatorElement.style.height = '2px';
    }

    this.dropIndicatorElement.style.opacity = '1';
  }

  // Hide drop indicator
  hideDropIndicator(): void {
    if (this.dropIndicatorElement) {
      this.dropIndicatorElement.style.opacity = '0';
    }
  }

  // Check if drop is valid
  canDrop(targetParentId: number | null): boolean {
    const dragData = this.dragData;
    if (!dragData) return false;

    // Check if target can accept children
    if (!this.canAcceptDrop(targetParentId)) return false;

    // Prevent dropping widget into itself or its descendants
    if (dragData.type === 'existing-widget' && dragData.widget) {
      if (dragData.widget.id === targetParentId) return false;
      // TODO: Check descendants
    }

    return true;
  }

  // End drag operation
  endDrag(): void {
    this.dragDataSubject.next(null);
    this.isDraggingSubject.next(false);
    this.setActiveDropZone(null);
    this.hideDropIndicator();
    this.clearGhostElement();
  }

  // Helper methods
  private canAcceptDrop(parentWidgetId: number | null): boolean {
    if (parentWidgetId === null) return true; // Root level always accepts

    // TODO: Get widget type from ID and check if it's a container
    return true;
  }

  private isHorizontalContainer(widgetId: number | null): boolean {
    // TODO: Get widget type and check if it's Row or horizontal container
    return false;
  }

  private findDropZone(element: HTMLElement): DropZone | null {
    const dropZones = this.dropZonesSubject.value;

    // Check if element is a drop zone
    let dropZone = dropZones.find(z => z.element === element);
    if (dropZone) return dropZone;

    // Check parent elements
    let parent = element.parentElement;
    while (parent) {
      dropZone = dropZones.find(z => z.element === parent);
      if (dropZone) return dropZone;
      parent = parent.parentElement;
    }

    return null;
  }

  private createGhostElement(widgetType: WidgetType): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'drag-ghost';
    this.ghostElement.style.cssText = `
      position: absolute;
      padding: 8px 16px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      pointer-events: none;
      z-index: 10001;
      left: -1000px;
      top: -1000px;
    `;
    this.ghostElement.textContent = widgetType;
    document.body.appendChild(this.ghostElement);
  }

  private createGhostElementForWidget(widget: Widget): void {
    this.createGhostElement(widget.widget_type);
  }

  private clearGhostElement(): void {
    if (this.ghostElement && this.ghostElement.parentNode) {
      this.ghostElement.parentNode.removeChild(this.ghostElement);
      this.ghostElement = null;
    }
  }

  // Check if widget can be parent
  isContainer(widgetType: WidgetType): boolean {
    return CONTAINER_WIDGETS.includes(widgetType);
  }

  // Check if drag is over valid drop zone
  isOverValidDropZone(x: number, y: number): boolean {
    const element = document.elementFromPoint(x, y);
    if (!element) return false;

    const dropZone = this.findDropZone(element as HTMLElement);
    return dropZone !== null && dropZone.canAccept;
  }

  // Get drop position in parent
  getDropPosition(parentElement: HTMLElement, y: number): number {
    const children = Array.from(parentElement.children);
    let insertIndex = children.length;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (y < midpoint) {
        insertIndex = i;
        break;
      }
    }

    return insertIndex;
  }
}
