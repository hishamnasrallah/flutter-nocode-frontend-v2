// src/app/core/directives/selectable.directive.ts

import { Directive, ElementRef, Input, Output, EventEmitter, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appSelectable]',
  standalone: true
})
export class SelectableDirective {
  @Input() selectableId: any;
  @Input() selectableGroup: string = 'default';
  @Input() multiSelect: boolean = true;
  @Input() selectOnClick: boolean = true;

  @Output() selected = new EventEmitter<any>();
  @Output() deselected = new EventEmitter<any>();
  @Output() selectionChanged = new EventEmitter<any[]>();

  private static selectedItems = new Map<string, Set<any>>();
  private isSelected = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.selectOnClick) return;

    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      this.toggleSelection();
    } else if (event.shiftKey && this.multiSelect) {
      // Range select with Shift
      this.selectRange();
    } else {
      // Single select
      this.selectExclusive();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Prevent text selection during multi-select
    if ((event.ctrlKey || event.metaKey || event.shiftKey) && this.multiSelect) {
      event.preventDefault();
    }
  }

  private toggleSelection(): void {
    if (this.isSelected) {
      this.deselect();
    } else {
      this.select();
    }
  }

  private selectExclusive(): void {
    // Clear all selections in group
    this.clearGroupSelection();
    this.select();
  }

  private selectRange(): void {
    // Get all selectable items in group
    const group = SelectableDirective.selectedItems.get(this.selectableGroup);
    if (!group || group.size === 0) {
      this.select();
      return;
    }

    // Find last selected item
    const lastSelected = Array.from(group).pop();
    if (!lastSelected) {
      this.select();
      return;
    }

    // Select all items between last selected and current
    const allItems = document.querySelectorAll(`[appSelectable][selectableGroup="${this.selectableGroup}"]`);
    let inRange = false;
    let startFound = false;
    let endFound = false;

    allItems.forEach((item: any) => {
      const directive = (item as any).__selectableDirective;
      if (!directive) return;

      if (directive.selectableId === lastSelected || directive.selectableId === this.selectableId) {
        if (!startFound) {
          startFound = true;
          inRange = true;
        } else {
          endFound = true;
        }
      }

      if (inRange) {
        directive.select();
      }

      if (endFound) {
        inRange = false;
      }
    });
  }

  select(): void {
    if (this.isSelected) return;

    this.isSelected = true;
    this.renderer.addClass(this.el.nativeElement, 'selected');

    // Add to group selection
    if (!SelectableDirective.selectedItems.has(this.selectableGroup)) {
      SelectableDirective.selectedItems.set(this.selectableGroup, new Set());
    }
    SelectableDirective.selectedItems.get(this.selectableGroup)!.add(this.selectableId);

    this.selected.emit(this.selectableId);
    this.emitSelectionChanged();
  }

  deselect(): void {
    if (!this.isSelected) return;

    this.isSelected = false;
    this.renderer.removeClass(this.el.nativeElement, 'selected');

    // Remove from group selection
    const group = SelectableDirective.selectedItems.get(this.selectableGroup);
    if (group) {
      group.delete(this.selectableId);
    }

    this.deselected.emit(this.selectableId);
    this.emitSelectionChanged();
  }

  private clearGroupSelection(): void {
    const allItems = document.querySelectorAll(`[appSelectable][selectableGroup="${this.selectableGroup}"]`);
    allItems.forEach((item: any) => {
      const directive = (item as any).__selectableDirective;
      if (directive && directive !== this) {
        directive.deselect();
      }
    });
  }

  private emitSelectionChanged(): void {
    const group = SelectableDirective.selectedItems.get(this.selectableGroup);
    const selected = group ? Array.from(group) : [];
    this.selectionChanged.emit(selected);
  }

  ngOnInit(): void {
    // Store reference to directive on element for range selection
    (this.el.nativeElement as any).__selectableDirective = this;
  }

  ngOnDestroy(): void {
    this.deselect();
    delete (this.el.nativeElement as any).__selectableDirective;
  }

  // Public API
  static getSelectedItems(group: string): any[] {
    const items = SelectableDirective.selectedItems.get(group);
    return items ? Array.from(items) : [];
  }

  static clearSelection(group: string): void {
    const allItems = document.querySelectorAll(`[appSelectable][selectableGroup="${group}"]`);
    allItems.forEach((item: any) => {
      const directive = (item as any).__selectableDirective;
      if (directive) {
        directive.deselect();
      }
    });
  }

  static selectAll(group: string): void {
    const allItems = document.querySelectorAll(`[appSelectable][selectableGroup="${group}"]`);
    allItems.forEach((item: any) => {
      const directive = (item as any).__selectableDirective;
      if (directive) {
        directive.select();
      }
    });
  }
}
