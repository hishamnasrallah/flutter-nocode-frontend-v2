// src/app/core/directives/droppable.directive.ts

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { DragDropService } from '../services/drag-drop.service';
import { Widget, WidgetType, CONTAINER_WIDGETS } from '../models/widget.model';

export interface DropEvent {
  dragType: 'new-widget' | 'existing-widget';
  widgetType?: WidgetType;
  widget?: Widget;
  targetParentId: number | null;
  targetIndex: number;
  mousePosition: { x: number; y: number };
}

@Directive({
  selector: '[appDroppable]',
  standalone: true
})
export class DroppableDirective implements OnInit, OnDestroy {
  @Input() parentWidgetId: number | null = null;
  @Input() parentWidgetType?: WidgetType;
  @Input() acceptTypes: WidgetType[] = [];
  @Input() dropEnabled: boolean = true;
  @Input() dropIndex: number = 0;

  @Output() dropped = new EventEmitter<DropEvent>();
  @Output() dragOver = new EventEmitter<DragEvent>();
  @Output() dragEnter = new EventEmitter<DragEvent>();
  @Output() dragLeave = new EventEmitter<DragEvent>();

  private dragCounter = 0;
  private dropIndicator: HTMLElement | null = null;
  private isValidDropZone = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private dragDropService: DragDropService
  ) {}

  ngOnInit(): void {
    this.setupDropZone();
    this.createDropIndicator();
  }

  ngOnDestroy(): void {
    this.removeDropIndicator();
    this.dragDropService.unregisterDropZone(this.el.nativeElement);
  }

  private setupDropZone(): void {
    const element = this.el.nativeElement;

    if (this.dropEnabled) {
      element.classList.add('drop-zone');

      // Register with drag service
      this.dragDropService.registerDropZone(
        element,
        this.parentWidgetId,
        this.dropIndex
      );
    }
  }

  private createDropIndicator(): void {
    this.dropIndicator = this.renderer.createElement('div');
    this.renderer.addClass(this.dropIndicator, 'drop-position-indicator');
    this.renderer.setStyle(this.dropIndicator, 'display', 'none');
    this.renderer.setStyle(this.dropIndicator, 'position', 'absolute');
    this.renderer.setStyle(this.dropIndicator, 'background', '#2196F3');
    this.renderer.setStyle(this.dropIndicator, 'z-index', '9999');
    this.renderer.setStyle(this.dropIndicator, 'pointer-events', 'none');
    this.renderer.setStyle(this.dropIndicator, 'transition', 'all 0.2s ease');

    this.renderer.appendChild(this.el.nativeElement, this.dropIndicator);
  }

  private removeDropIndicator(): void {
    if (this.dropIndicator && this.dropIndicator.parentNode) {
      this.renderer.removeChild(this.el.nativeElement, this.dropIndicator);
      this.dropIndicator = null;
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    const dragData = this.dragDropService.dragData;
    if (!dragData) return;

    // Check if this is a valid drop target
    this.isValidDropZone = this.canAcceptDrop(dragData);

    if (this.isValidDropZone) {
      event.dataTransfer!.dropEffect = dragData.type === 'new-widget' ? 'copy' : 'move';

      // Show drop indicator
      this.showDropIndicator(event);

      // Update drag service
      this.dragDropService.updateDragPosition(event.clientX, event.clientY);

      this.dragOver.emit(event);
    } else {
      event.dataTransfer!.dropEffect = 'none';
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (!this.dropEnabled || !this.isValidDropZone) return;

    event.preventDefault();
    event.stopPropagation();

    const dragData = this.dragDropService.dragData;
    if (!dragData) return;

    // Hide visual feedback
    this.hideDropIndicator();
    this.el.nativeElement.classList.remove('drag-over');

    // Calculate drop position
    const dropIndex = this.calculateDropIndex(event);

    // Emit drop event
    const dropEvent: DropEvent = {
      dragType: dragData.type,
      widgetType: dragData.widgetType,
      widget: dragData.widget,
      targetParentId: this.parentWidgetId,
      targetIndex: dropIndex,
      mousePosition: {
        x: event.clientX,
        y: event.clientY
      }
    };

    this.dropped.emit(dropEvent);

    // Reset drag counter
    this.dragCounter = 0;

    // End drag operation
    this.dragDropService.endDrag();
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    this.dragCounter++;

    if (this.dragCounter === 1 && this.isValidDropZone) {
      this.el.nativeElement.classList.add('drag-over');
      this.dragEnter.emit(event);
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (!this.dropEnabled) return;

    event.preventDefault();
    event.stopPropagation();

    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.el.nativeElement.classList.remove('drag-over');
      this.hideDropIndicator();
      this.dragLeave.emit(event);
    }
  }

  // Handle custom drop event from touch devices
  @HostListener('customDrop', ['$event'])
  onCustomDrop(event: Event): void {
    if (!this.dropEnabled) return;

    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;
    const dragData = detail.dragData;

    if (!dragData || !this.canAcceptDrop(dragData)) return;

    // Calculate drop position
    const dropIndex = this.calculateDropIndexFromPosition(detail.clientY);

    // Emit drop event
    const dropEvent: DropEvent = {
      dragType: dragData.type,
      widgetType: dragData.widgetType,
      widget: dragData.widget,
      targetParentId: this.parentWidgetId,
      targetIndex: dropIndex,
      mousePosition: {
        x: detail.clientX,
        y: detail.clientY
      }
    };

    this.dropped.emit(dropEvent);
  }

  private canAcceptDrop(dragData: any): boolean {
    // Check if target can accept children
    if (this.parentWidgetType && !CONTAINER_WIDGETS.includes(this.parentWidgetType)) {
      return false;
    }

    // Check if specific types are restricted
    if (this.acceptTypes.length > 0 && dragData.widgetType) {
      if (!this.acceptTypes.includes(dragData.widgetType)) {
        return false;
      }
    }

    // Prevent dropping widget into itself
    if (dragData.type === 'existing-widget' && dragData.widget) {
      if (dragData.widget.id === this.parentWidgetId) {
        return false;
      }

      // TODO: Check if target is a descendant of the dragged widget
    }

    return true;
  }

  private showDropIndicator(event: DragEvent): void {
    if (!this.dropIndicator) return;

    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    const isHorizontal = this.isHorizontalContainer();

    // Determine where to show the indicator
    const position = this.getDropPosition(event, rect, isHorizontal);

    if (isHorizontal) {
      // Vertical line for horizontal containers
      this.renderer.setStyle(this.dropIndicator, 'width', '2px');
      this.renderer.setStyle(this.dropIndicator, 'height', '100%');
      this.renderer.setStyle(this.dropIndicator, 'top', '0');
      this.renderer.setStyle(this.dropIndicator, 'left', `${position}px`);
    } else {
      // Horizontal line for vertical containers
      this.renderer.setStyle(this.dropIndicator, 'width', '100%');
      this.renderer.setStyle(this.dropIndicator, 'height', '2px');
      this.renderer.setStyle(this.dropIndicator, 'left', '0');
      this.renderer.setStyle(this.dropIndicator, 'top', `${position}px`);
    }

    this.renderer.setStyle(this.dropIndicator, 'display', 'block');
  }

  private hideDropIndicator(): void {
    if (this.dropIndicator) {
      this.renderer.setStyle(this.dropIndicator, 'display', 'none');
    }
  }

  private isHorizontalContainer(): boolean {
    return this.parentWidgetType === 'Row' ||
           this.parentWidgetType === 'Wrap';
  }

  private getDropPosition(event: DragEvent, rect: DOMRect, isHorizontal: boolean): number {
    if (isHorizontal) {
      const relativeX = event.clientX - rect.left;
      const children = this.getDirectChildren();

      if (children.length === 0) {
        return rect.width / 2;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2 - rect.left;

        if (relativeX < childCenter) {
          return childRect.left - rect.left;
        }
      }

      return rect.width;
    } else {
      const relativeY = event.clientY - rect.top;
      const children = this.getDirectChildren();

      if (children.length === 0) {
        return rect.height / 2;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.top + childRect.height / 2 - rect.top;

        if (relativeY < childCenter) {
          return childRect.top - rect.top;
        }
      }

      return rect.height;
    }
  }

  private calculateDropIndex(event: DragEvent): number {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const isHorizontal = this.isHorizontalContainer();
    const children = this.getDirectChildren();

    if (children.length === 0) {
      return 0;
    }

    if (isHorizontal) {
      const x = event.clientX;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.left + childRect.width / 2;

        if (x < childCenter) {
          return i;
        }
      }
    } else {
      const y = event.clientY;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childRect = child.getBoundingClientRect();
        const childCenter = childRect.top + childRect.height / 2;

        if (y < childCenter) {
          return i;
        }
      }
    }

    return children.length;
  }

  private calculateDropIndexFromPosition(y: number): number {
    const children = this.getDirectChildren();

    if (children.length === 0) {
      return 0;
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.top + childRect.height / 2;

      if (y < childCenter) {
        return i;
      }
    }

    return children.length;
  }

  private getDirectChildren(): Element[] {
    const element = this.el.nativeElement;
    return Array.from(element.children).filter(child =>
      child.classList.contains('widget-container') &&
      child !== this.dropIndicator
    );
  }
}
