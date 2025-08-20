// src/app/features/builder/canvas/canvas.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DeviceFrameComponent } from '../device-frame/device-frame.component';
import { WidgetRendererComponent } from '../widget-renderer/widget-renderer.component';
import { DraggableDirective } from '../../../core/directives/draggable.directive';
import { DroppableDirective } from '../../../core/directives/droppable.directive';
import { CanvasService } from '../../../core/services/canvas.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { Screen } from '../../../core/models/screen.model';
import { Widget } from '../../../core/models/widget.model';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    DeviceFrameComponent,
    WidgetRendererComponent,
    DraggableDirective,
    DroppableDirective
  ],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef<HTMLDivElement>;

  @Input() screen: Screen | null = null;
  @Input() widgets: Widget[] = [];
  @Input() selectedWidget: Widget | null = null;
  @Input() deviceType: string = 'iphone14';
  @Input() zoom: number = 100;

  @Output() widgetDropped = new EventEmitter<any>();
  @Output() widgetSelected = new EventEmitter<Widget>();
  @Output() widgetDeleted = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  widgetTree: Widget[] = [];
  hoveredWidgetId: number | null = null;
  isDragging = false;
  dropIndicatorStyle: any = null;

  constructor(
    private canvasService: CanvasService,
    private dragDropService: DragDropService
  ) {}

get publicCanvasService() {
  return this.canvasService;
}

get publicDragDropService() {
  return this.dragDropService;
}
  ngOnInit(): void {
    this.buildWidgetTree();
    this.subscribeToServices();
    this.canvasService.setZoom(this.zoom);
    this.canvasService.setDeviceType(this.deviceType);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.buildWidgetTree();
    if (this.zoom !== this.canvasService.canvasState.zoom) {
      this.canvasService.setZoom(this.zoom);
    }
    if (this.deviceType !== this.canvasService.canvasState.deviceType) {
      this.canvasService.setDeviceType(this.deviceType);
    }
  }

  private subscribeToServices(): void {
    this.dragDropService.isDragging$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDragging => {
        this.isDragging = isDragging;
      });

    this.dragDropService.activeDropZone$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dropZone => {
        if (dropZone) {
          this.showDropIndicator(dropZone);
        } else {
          this.hideDropIndicator();
        }
      });
  }

  private buildWidgetTree(): void {
    // Build hierarchical tree from flat widget list
    const widgetMap = new Map<number, Widget>();
    const rootWidgets: Widget[] = [];

    // First pass: create map
    this.widgets.forEach(widget => {
      widgetMap.set(widget.id, { ...widget, child_widgets: [] });
    });

    // Second pass: build tree
    this.widgets.forEach(widget => {
      const node = widgetMap.get(widget.id)!;
      if (widget.parent_widget) {
        const parent = widgetMap.get(widget.parent_widget);
        if (parent) {
          if (!parent.child_widgets) parent.child_widgets = [];
          parent.child_widgets.push(node);
        }
      } else {
        rootWidgets.push(node);
      }
    });

    // Sort by order
    const sortByOrder = (widgets: Widget[]) => {
      widgets.sort((a, b) => a.order - b.order);
      widgets.forEach(w => {
        if (w.child_widgets) sortByOrder(w.child_widgets);
      });
    };

    sortByOrder(rootWidgets);
    this.widgetTree = rootWidgets;
  }

  onWidgetClick(widget: Widget, event: MouseEvent): void {
    event.stopPropagation();
    this.widgetSelected.emit(widget);
    this.canvasService.setSelectedWidget(widget.id);
  }

  onWidgetHover(widget: Widget | null): void {
    this.hoveredWidgetId = widget?.id || null;
    this.canvasService.setHoveredWidget(this.hoveredWidgetId);
  }

  onCanvasClick(event: MouseEvent): void {
    // Deselect widget when clicking on empty canvas
    if ((event.target as HTMLElement).classList.contains('device-screen')) {
      this.widgetSelected.emit(null as any);
      this.canvasService.setSelectedWidget(null);
    }
  }

  onCanvasDrop(event: any): void {
    if (!this.screen) return;

    const dropData = {
      widgetType: event.widgetType,
      widget: event.widget,
      targetParentId: event.targetParentId,
      targetIndex: event.targetIndex,
      screenId: this.screen.id
    };

    this.widgetDropped.emit(dropData);
    this.hideDropIndicator();
  }

  onWidgetDelete(widgetId: number): void {
    this.widgetDeleted.emit(widgetId);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.selectedWidget) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.onWidgetDelete(this.selectedWidget.id);
      }
    }
  }

  private showDropIndicator(dropZone: any): void {
    // Calculate position for drop indicator
    const rect = dropZone.element.getBoundingClientRect();
    const canvasRect = this.canvasContainer?.nativeElement.getBoundingClientRect();

    if (canvasRect) {
      this.dropIndicatorStyle = {
        position: 'absolute',
        left: `${rect.left - canvasRect.left}px`,
        top: `${rect.top - canvasRect.top}px`,
        width: `${rect.width}px`,
        height: '2px',
        background: '#2196F3',
        opacity: '1',
        zIndex: '1000'
      };
    }
  }

  private hideDropIndicator(): void {
    this.dropIndicatorStyle = null;
  }

  getCanvasStyle(): any {
    return {
      transform: `scale(${this.zoom / 100})`,
      transformOrigin: 'center center'
    };
  }

  isWidgetSelected(widget: Widget): boolean {
    return this.selectedWidget?.id === widget.id;
  }

  isWidgetHovered(widget: Widget): boolean {
    return this.hoveredWidgetId === widget.id && !this.isWidgetSelected(widget);
  }

  trackByWidgetId(index: number, widget: Widget): number {
    return widget.id;
  }
}
