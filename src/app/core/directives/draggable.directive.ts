// src/app/core/directives/draggable.directive.ts

import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { DragDropService } from '../services/drag-drop.service';
import { Widget, WidgetType } from '../models/widget.model';

@Directive({
  selector: '[appDraggable]',
  standalone: true
})
export class DraggableDirective implements OnInit, OnDestroy {
  @Input() dragData: any;
  @Input() dragType: 'new-widget' | 'existing-widget' = 'new-widget';
  @Input() widget?: Widget;
  @Input() widgetType?: WidgetType;
  @Input() dragHandle?: string;
  @Input() dragEnabled: boolean = true;

  @Output() dragStarted = new EventEmitter<DragEvent>();
  @Output() dragEnded = new EventEmitter<DragEvent>();
  @Output() dragMoved = new EventEmitter<DragEvent>();

  private isDragging = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private dragDropService: DragDropService
  ) {}

  ngOnInit(): void {
    this.setupDraggable();
  }

  ngOnDestroy(): void {
    this.el.nativeElement.draggable = false;
  }

  private setupDraggable(): void {
    const element = this.el.nativeElement;

    if (this.dragEnabled) {
      element.draggable = true;
      element.style.cursor = 'move';
      element.classList.add('draggable');

      // Add visual feedback
      element.addEventListener('mouseenter', () => {
        if (!this.isDragging && this.dragEnabled) {
          element.style.opacity = '0.9';
        }
      });

      element.addEventListener('mouseleave', () => {
        if (!this.isDragging) {
          element.style.opacity = '1';
        }
      });
    }
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    if (!this.dragEnabled) {
      event.preventDefault();
      return;
    }

    // Check if drag handle is specified and if drag started from it
    if (this.dragHandle) {
      const handle = (event.target as HTMLElement).closest(this.dragHandle);
      if (!handle) {
        event.preventDefault();
        return;
      }
    }

    this.isDragging = true;
    const element = this.el.nativeElement;

    // Add dragging class
    element.classList.add('dragging');
    element.style.opacity = '0.5';

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = this.dragType === 'new-widget' ? 'copy' : 'move';

      if (this.dragType === 'new-widget' && this.widgetType) {
        event.dataTransfer.setData('widgetType', this.widgetType);
        event.dataTransfer.setData('dragType', 'new-widget');
        this.dragDropService.startDragNewWidget(this.widgetType, event);
      } else if (this.dragType === 'existing-widget' && this.widget) {
        event.dataTransfer.setData('widgetId', this.widget.id.toString());
        event.dataTransfer.setData('dragType', 'existing-widget');
        this.dragDropService.startDragExistingWidget(this.widget, event);
      }

      // Set custom drag data if provided
      if (this.dragData) {
        event.dataTransfer.setData('customData', JSON.stringify(this.dragData));
      }
    }

    this.dragStarted.emit(event);

    // Prevent event from bubbling
    event.stopPropagation();
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent): void {
    this.isDragging = false;
    const element = this.el.nativeElement;

    // Remove dragging class
    element.classList.remove('dragging');
    element.style.opacity = '1';

    // End drag in service
    this.dragDropService.endDrag();

    this.dragEnded.emit(event);

    // Prevent event from bubbling
    event.stopPropagation();
  }

  @HostListener('drag', ['$event'])
  onDrag(event: DragEvent): void {
    if (event.clientX !== 0 || event.clientY !== 0) {
      this.dragDropService.updateDragPosition(event.clientX, event.clientY);
      this.dragMoved.emit(event);
    }
  }

  // Touch support for mobile devices
  private touchStartX = 0;
  private touchStartY = 0;
  private touchElement: HTMLElement | null = null;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.dragEnabled) return;

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Create a clone for visual feedback
    const element = this.el.nativeElement;
    this.touchElement = element.cloneNode(true) as HTMLElement;
    this.touchElement.style.position = 'fixed';
    this.touchElement.style.pointerEvents = 'none';
    this.touchElement.style.opacity = '0.5';
    this.touchElement.style.zIndex = '10000';
    this.touchElement.style.left = `${touch.clientX}px`;
    this.touchElement.style.top = `${touch.clientY}px`;
    document.body.appendChild(this.touchElement);

    // Start drag
    if (this.dragType === 'new-widget' && this.widgetType) {
      const fakeEvent = { dataTransfer: { effectAllowed: '', setData: () => {}, setDragImage: () => {} } } as any;
      this.dragDropService.startDragNewWidget(this.widgetType, fakeEvent);
    } else if (this.dragType === 'existing-widget' && this.widget) {
      const fakeEvent = { dataTransfer: { effectAllowed: '', setData: () => {}, setDragImage: () => {} } } as any;
      this.dragDropService.startDragExistingWidget(this.widget, fakeEvent);
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.touchElement) return;

    event.preventDefault();
    const touch = event.touches[0];

    // Update clone position
    this.touchElement.style.left = `${touch.clientX - 50}px`;
    this.touchElement.style.top = `${touch.clientY - 20}px`;

    // Update drag position
    this.dragDropService.updateDragPosition(touch.clientX, touch.clientY);
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.touchElement) return;

    // Remove clone
    document.body.removeChild(this.touchElement);
    this.touchElement = null;

    // Find drop target
    const touch = event.changedTouches[0];
    const dropElement = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropElement) {
      // Trigger drop event on the element
      const dropEvent = new CustomEvent('customDrop', {
        detail: {
          clientX: touch.clientX,
          clientY: touch.clientY,
          dragData: this.dragDropService.dragData
        }
      });
      dropElement.dispatchEvent(dropEvent);
    }

    // End drag
    this.dragDropService.endDrag();
  }
}
