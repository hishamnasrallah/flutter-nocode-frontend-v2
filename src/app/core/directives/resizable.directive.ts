// src/app/core/directives/resizable.directive.ts

import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, Renderer2 } from '@angular/core';

interface ResizeHandle {
  position: string;
  cursor: string;
  element?: HTMLElement;
}

@Directive({
  selector: '[appResizable]',
  standalone: true
})
export class ResizableDirective implements OnInit {
  @Input() resizeEnabled: boolean = true;
  @Input() minWidth: number = 50;
  @Input() minHeight: number = 50;
  @Input() maxWidth: number = 9999;
  @Input() maxHeight: number = 9999;
  @Input() maintainAspectRatio: boolean = false;
  @Input() snapToGrid: number = 0;

  @Output() resizeStart = new EventEmitter<any>();
  @Output() resizing = new EventEmitter<any>();
  @Output() resizeEnd = new EventEmitter<any>();

  private handles: ResizeHandle[] = [
    { position: 'top-left', cursor: 'nw-resize' },
    { position: 'top', cursor: 'n-resize' },
    { position: 'top-right', cursor: 'ne-resize' },
    { position: 'right', cursor: 'e-resize' },
    { position: 'bottom-right', cursor: 'se-resize' },
    { position: 'bottom', cursor: 's-resize' },
    { position: 'bottom-left', cursor: 'sw-resize' },
    { position: 'left', cursor: 'w-resize' }
  ];

  private isResizing = false;
  private currentHandle: ResizeHandle | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private aspectRatio = 1;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (this.resizeEnabled) {
      this.createHandles();
      this.setupEventListeners();
    }
  }

  private createHandles(): void {
    this.handles.forEach(handle => {
      const handleEl = this.renderer.createElement('div');
      this.renderer.addClass(handleEl, 'resize-handle');
      this.renderer.addClass(handleEl, `handle-${handle.position}`);
      this.renderer.setStyle(handleEl, 'cursor', handle.cursor);
      this.renderer.setStyle(handleEl, 'position', 'absolute');
      this.renderer.setStyle(handleEl, 'width', '8px');
      this.renderer.setStyle(handleEl, 'height', '8px');
      this.renderer.setStyle(handleEl, 'background', '#2196F3');
      this.renderer.setStyle(handleEl, 'border', '1px solid white');
      this.renderer.setStyle(handleEl, 'border-radius', '50%');
      this.renderer.setStyle(handleEl, 'z-index', '1000');

      // Position handles
      switch (handle.position) {
        case 'top-left':
          this.renderer.setStyle(handleEl, 'top', '-4px');
          this.renderer.setStyle(handleEl, 'left', '-4px');
          break;
        case 'top':
          this.renderer.setStyle(handleEl, 'top', '-4px');
          this.renderer.setStyle(handleEl, 'left', '50%');
          this.renderer.setStyle(handleEl, 'transform', 'translateX(-50%)');
          break;
        case 'top-right':
          this.renderer.setStyle(handleEl, 'top', '-4px');
          this.renderer.setStyle(handleEl, 'right', '-4px');
          break;
        case 'right':
          this.renderer.setStyle(handleEl, 'top', '50%');
          this.renderer.setStyle(handleEl, 'right', '-4px');
          this.renderer.setStyle(handleEl, 'transform', 'translateY(-50%)');
          break;
        case 'bottom-right':
          this.renderer.setStyle(handleEl, 'bottom', '-4px');
          this.renderer.setStyle(handleEl, 'right', '-4px');
          break;
        case 'bottom':
          this.renderer.setStyle(handleEl, 'bottom', '-4px');
          this.renderer.setStyle(handleEl, 'left', '50%');
          this.renderer.setStyle(handleEl, 'transform', 'translateX(-50%)');
          break;
        case 'bottom-left':
          this.renderer.setStyle(handleEl, 'bottom', '-4px');
          this.renderer.setStyle(handleEl, 'left', '-4px');
          break;
        case 'left':
          this.renderer.setStyle(handleEl, 'top', '50%');
          this.renderer.setStyle(handleEl, 'left', '-4px');
          this.renderer.setStyle(handleEl, 'transform', 'translateY(-50%)');
          break;
      }

      handle.element = handleEl;
      this.renderer.appendChild(this.el.nativeElement, handleEl);

      // Add mouse event listeners
      this.renderer.listen(handleEl, 'mousedown', (e) => this.onMouseDown(e, handle));
    });
  }

  private setupEventListeners(): void {
    this.renderer.listen('document', 'mousemove', (e) => this.onMouseMove(e));
    this.renderer.listen('document', 'mouseup', (e) => this.onMouseUp(e));
  }

  private onMouseDown(event: MouseEvent, handle: ResizeHandle): void {
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.currentHandle = handle;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.startWidth = rect.width;
    this.startHeight = rect.height;
    this.aspectRatio = this.startWidth / this.startHeight;

    this.resizeStart.emit({
      width: this.startWidth,
      height: this.startHeight,
      handle: handle.position
    });

    // Add resizing class
    this.renderer.addClass(this.el.nativeElement, 'resizing');
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing || !this.currentHandle) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    switch (this.currentHandle.position) {
      case 'right':
        newWidth = this.startWidth + deltaX;
        break;
      case 'left':
        newWidth = this.startWidth - deltaX;
        break;
      case 'bottom':
        newHeight = this.startHeight + deltaY;
        break;
      case 'top':
        newHeight = this.startHeight - deltaY;
        break;
      case 'bottom-right':
        newWidth = this.startWidth + deltaX;
        newHeight = this.maintainAspectRatio ? newWidth / this.aspectRatio : this.startHeight + deltaY;
        break;
      case 'bottom-left':
        newWidth = this.startWidth - deltaX;
        newHeight = this.maintainAspectRatio ? newWidth / this.aspectRatio : this.startHeight + deltaY;
        break;
      case 'top-right':
        newWidth = this.startWidth + deltaX;
        newHeight = this.maintainAspectRatio ? newWidth / this.aspectRatio : this.startHeight - deltaY;
        break;
      case 'top-left':
        newWidth = this.startWidth - deltaX;
        newHeight = this.maintainAspectRatio ? newWidth / this.aspectRatio : this.startHeight - deltaY;
        break;
    }

    // Apply constraints
    newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
    newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, newHeight));

    // Snap to grid
    if (this.snapToGrid > 0) {
      newWidth = Math.round(newWidth / this.snapToGrid) * this.snapToGrid;
      newHeight = Math.round(newHeight / this.snapToGrid) * this.snapToGrid;
    }

    // Apply new dimensions
    this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    this.renderer.setStyle(this.el.nativeElement, 'height', `${newHeight}px`);

    this.resizing.emit({
      width: newWidth,
      height: newHeight,
      deltaX,
      deltaY
    });
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.currentHandle = null;

    this.renderer.removeClass(this.el.nativeElement, 'resizing');

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.resizeEnd.emit({
      width: rect.width,
      height: rect.height
    });
  }

  // Public methods
  setSize(width: number, height: number): void {
    this.renderer.setStyle(this.el.nativeElement, 'width', `${width}px`);
    this.renderer.setStyle(this.el.nativeElement, 'height', `${height}px`);
  }

  showHandles(): void {
    this.handles.forEach(handle => {
      if (handle.element) {
        this.renderer.setStyle(handle.element, 'display', 'block');
      }
    });
  }

  hideHandles(): void {
    this.handles.forEach(handle => {
      if (handle.element) {
        this.renderer.setStyle(handle.element, 'display', 'none');
      }
    });
  }
}
