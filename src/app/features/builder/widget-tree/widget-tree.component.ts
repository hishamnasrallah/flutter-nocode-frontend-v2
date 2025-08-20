// src/app/features/builder/widget-tree/widget-tree.component.ts

import {Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DraggableDirective} from '../../../core/directives/draggable.directive';
import {DroppableDirective} from '../../../core/directives/droppable.directive';
import {Widget, WidgetType, CONTAINER_WIDGETS} from '../../../core/models/widget.model';
import {TreeBuilder} from '../../../core/utils/tree-builder';

export interface TreeNode {
  widget: Widget;
  children: TreeNode[];
  level: number;
  expanded: boolean;
  visible: boolean;
}

@Component({
  selector: 'app-widget-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, DraggableDirective, DroppableDirective],
  templateUrl: './widget-tree.component.html',
  styleUrls: ['./widget-tree.component.scss']
})
export class WidgetTreeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() widgets: Widget[] = [];
  @Input() selectedWidget: Widget | null = null;
  @Output() widgetSelected = new EventEmitter<Widget>();
  @Output() widgetDeleted = new EventEmitter<number>();
  @Output() widgetDuplicated = new EventEmitter<Widget>();
  @Output() widgetReordered = new EventEmitter<{ widget: Widget, newParent: number | null, newIndex: number }>();

  treeNodes: TreeNode[] = [];
  visibleNodes: TreeNode[] = [];
  expandedNodes = new Set<number>();
  searchQuery = '';

  // Context menu
  contextMenuVisible = false;
  contextMenuPosition = {x: 0, y: 0};
  contextMenuNode: TreeNode | null = null;
  hasClipboard = false;
  canMoveUp = false;
  canMoveDown = false;

  // Clipboard
  private clipboardWidget: Widget | null = null;

  ngOnInit(): void {
    this.buildTree();
    // Expand first level by default
    this.treeNodes.forEach(node => {
      this.expandedNodes.add(node.widget.id);
      node.expanded = true;
    });
    this.updateVisibleNodes();
  }

  ngOnChanges(): void {
    this.buildTree();
    this.updateVisibleNodes();
  }

  ngOnDestroy(): void {
    this.hideContextMenu();
  }

  buildTree(): void {
    this.treeNodes = TreeBuilder.buildWidgetTree(this.widgets);

    // Restore expanded state
    const restoreExpanded = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (this.expandedNodes.has(node.widget.id)) {
          node.expanded = true;
        }
        if (node.children.length > 0) {
          restoreExpanded(node.children);
        }
      });
    };
    restoreExpanded(this.treeNodes);
  }

  updateVisibleNodes(): void {
    if (this.searchQuery) {
      this.visibleNodes = TreeBuilder.searchTree(this.treeNodes, this.searchQuery);
    } else {
      this.visibleNodes = TreeBuilder.flattenTree(this.treeNodes);
    }
  }

  filterTree(): void {
    this.updateVisibleNodes();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.updateVisibleNodes();
  }

  toggleNode(nodeId: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }

    // Update node expanded state
    const updateExpanded = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.widget.id === nodeId) {
          node.expanded = !node.expanded;
        }
        if (node.children.length > 0) {
          updateExpanded(node.children);
        }
      });
    };
    updateExpanded(this.treeNodes);

    this.updateVisibleNodes();
  }

  onNodeClick(node: TreeNode): void {
    this.widgetSelected.emit(node.widget);
    this.hideContextMenu();
  }

  onNodeDragStart(event: DragEvent, node: TreeNode): void {
    // Handled by directive
  }

  onNodeDrop(event: any, targetNode: TreeNode): void {
    const sourceWidget = event.widget;
    if (sourceWidget && this.canAcceptChildren(targetNode.widget.widget_type)) {
      this.widgetReordered.emit({
        widget: widget,
        newParent: widget.parent_widget as number | null,
        newIndex: currentIndex - 1
      });
    }
  }

  showContextMenu(event: MouseEvent, node: TreeNode): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuNode = node;
    this.contextMenuPosition = {
      x: event.clientX,
      y: event.clientY
    };

    // Adjust position if menu would go off-screen
    setTimeout(() => {
      const menu = document.querySelector('.context-menu') as HTMLElement;
      if (menu) {
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (rect.right > windowWidth) {
          this.contextMenuPosition.x = windowWidth - rect.width - 10;
        }
        if (rect.bottom > windowHeight) {
          this.contextMenuPosition.y = windowHeight - rect.height - 10;
        }
      }
    });

    this.hasClipboard = this.clipboardWidget !== null;
    this.updateMoveOptions(node);
    this.contextMenuVisible = true;
  }

  hideContextMenu(): void {
    this.contextMenuVisible = false;
    this.contextMenuNode = null;
  }

  onTreeContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.hideContextMenu();
  }

  onContextMenuAction(action: string): void {
    if (!this.contextMenuNode) return;

    switch (action) {
      case 'duplicate':
        this.duplicateWidget(this.contextMenuNode.widget);
        break;
      case 'copy':
        this.copyWidget(this.contextMenuNode.widget);
        break;
      case 'paste':
        this.pasteWidget(this.contextMenuNode.widget);
        break;
      case 'rename':
        this.renameWidget(this.contextMenuNode.widget);
        break;
      case 'moveUp':
        this.moveWidgetUp(this.contextMenuNode.widget);
        break;
      case 'moveDown':
        this.moveWidgetDown(this.contextMenuNode.widget);
        break;
      case 'delete':
        this.deleteWidget(this.contextMenuNode.widget);
        break;
    }

    this.hideContextMenu();
  }

  duplicateWidget(widget: Widget, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.widgetDuplicated.emit(widget);
  }

  deleteWidget(widget: Widget, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    // Check if widget has children
    const node = this.findNode(widget.id, this.treeNodes);
    if (node && node.children.length > 0) {
      if (!confirm(`Delete "${widget.widget_type}" and all ${node.children.length} child widget(s)?`)) {
        return;
      }
    }

    this.widgetDeleted.emit(widget.id);
  }

  copyWidget(widget: Widget): void {
    this.clipboardWidget = widget;
    this.hasClipboard = true;
  }

  pasteWidget(targetWidget: Widget): void {
    if (!this.clipboardWidget || !this.canAcceptChildren(targetWidget.widget_type)) {
      return;
    }

    // Emit paste event
    this.widgetDuplicated.emit(this.clipboardWidget);
  }

  renameWidget(widget: Widget): void {
    const newId = prompt('Enter widget ID:', widget.widget_id || '');
    if (newId !== null && newId !== widget.widget_id) {
      // Emit rename event
      // This would need to be handled by the parent component
    }
  }

  moveWidgetUp(widget: Widget): void {
    const siblings = this.getSiblings(widget);
    const currentIndex = siblings.findIndex(w => w.id === widget.id);

    if (currentIndex > 0) {
      this.widgetReordered.emit({
        widget: widget,
        newParent: widget.parent_widget as number | null,
        newIndex: currentIndex + 1
      });
    }
  }

  moveWidgetDown(widget: Widget): void {
    const siblings = this.getSiblings(widget);
    const currentIndex = siblings.findIndex(w => w.id === widget.id);

    if (currentIndex < siblings.length - 1) {
      this.widgetReordered.emit({
        widget: widget,
        newParent: widget.parent_widget,
        newIndex: currentIndex + 1
      });
    }
  }

  private updateMoveOptions(node: TreeNode): void {
    const siblings = this.getSiblings(node.widget);
    const currentIndex = siblings.findIndex(w => w.id === node.widget.id);

    this.canMoveUp = currentIndex > 0;
    this.canMoveDown = currentIndex < siblings.length - 1;
  }

  private getSiblings(widget: Widget): Widget[] {
    return this.widgets.filter(w => w.parent_widget === widget.parent_widget);
  }

  private findNode(widgetId: number, nodes: TreeNode[]): TreeNode | null {
    for (const node of nodes) {
      if (node.widget.id === widgetId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = this.findNode(widgetId, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  getNodeIcon(widgetType: WidgetType): string {
    const iconMap: Record<string, string> = {
      'Column': 'view_column',
      'Row': 'view_stream',
      'Container': 'crop_square',
      'Stack': 'layers',
      'Padding': 'format_indent_increase',
      'Center': 'format_align_center',
      'Expanded': 'unfold_more',
      'Text': 'text_fields',
      'Image': 'image',
      'Icon': 'emoji_emotions',
      'Card': 'credit_card',
      'Divider': 'remove',
      'TextField': 'input',
      'ElevatedButton': 'smart_button',
      'TextButton': 'touch_app',
      'IconButton': 'radio_button_checked',
      'Switch': 'toggle_on',
      'Checkbox': 'check_box',
      'ListView': 'list',
      'GridView': 'grid_on',
      'AppBar': 'web_asset',
      'Scaffold': 'web',
      'default': 'widgets'
    };

    return iconMap[widgetType] || iconMap['default'];
  }

  canAcceptChildren(widgetType: WidgetType): boolean {
    return CONTAINER_WIDGETS.includes(widgetType);
  }

  isSelected(node: TreeNode): boolean {
    return this.selectedWidget?.id === node.widget.id;
  }

  isExpanded(node: TreeNode): boolean {
    return this.expandedNodes.has(node.widget.id);
  }

  trackByNodeId(index: number, node: TreeNode): number {
    return node.widget.id;
  }

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.selectedWidget) return;

    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'd':
        case 'D':
          event.preventDefault();
          this.duplicateWidget(this.selectedWidget);
          break;
        case 'c':
        case 'C':
          event.preventDefault();
          this.copyWidget(this.selectedWidget);
          break;
        case 'v':
        case 'V':
          event.preventDefault();
          if (this.clipboardWidget) {
            this.pasteWidget(this.selectedWidget);
          }
          break;
      }
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.deleteWidget(this.selectedWidget);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Hide context menu when clicking outside
    if (this.contextMenuVisible) {
      const target = event.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    }
  }
}
