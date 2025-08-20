// src/app/core/utils/tree-builder.ts

import { Widget } from '../models/widget.model';

export interface TreeNode {
  widget: Widget;
  children: TreeNode[];
  level: number;
  expanded: boolean;
  visible: boolean;
}

export class TreeBuilder {
  /**
   * Build a hierarchical tree structure from flat widget array
   */
  static buildWidgetTree(widgets: Widget[]): TreeNode[] {
    const nodeMap = new Map<number, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    widgets.forEach(widget => {
      nodeMap.set(widget.id, {
        widget: widget,
        children: [],
        level: 0,
        expanded: true,
        visible: true
      });
    });

    // Second pass: build hierarchy
    widgets.forEach(widget => {
      const node = nodeMap.get(widget.id)!;

      if (widget.parent_widget) {
        const parent = nodeMap.get(widget.parent_widget);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          // Parent not found, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent, this is a root node
        rootNodes.push(node);
      }
    });

    // Sort by order
    this.sortNodes(rootNodes);

    return rootNodes;
  }

  /**
   * Sort nodes recursively by their order property
   */
  static sortNodes(nodes: TreeNode[]): void {
    nodes.sort((a, b) => a.widget.order - b.widget.order);
    nodes.forEach(node => {
      if (node.children.length > 0) {
        this.sortNodes(node.children);
      }
    });
  }

  /**
   * Flatten tree structure into a linear array for display
   * Only includes expanded nodes
   */
  static flattenTree(nodes: TreeNode[]): TreeNode[] {
    const flat: TreeNode[] = [];

    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.visible) {
          flat.push(node);
          if (node.expanded && node.children.length > 0) {
            traverse(node.children);
          }
        }
      });
    };

    traverse(nodes);
    return flat;
  }

  /**
   * Search tree nodes based on query string
   * Shows parent nodes if child matches
   */
  static searchTree(nodes: TreeNode[], query: string): TreeNode[] {
    if (!query || query.trim() === '') {
      return this.flattenTree(nodes);
    }

    const lowerQuery = query.toLowerCase();
    const matchedNodes = new Set<TreeNode>();
    const parentNodes = new Set<TreeNode>();

    // Find matching nodes and their parents
    const findMatches = (nodes: TreeNode[], parent: TreeNode | null = null) => {
      nodes.forEach(node => {
        const matches =
          node.widget.widget_type.toLowerCase().includes(lowerQuery) ||
          (node.widget.widget_id && node.widget.widget_id.toLowerCase().includes(lowerQuery));

        if (matches) {
          matchedNodes.add(node);

          // Add all parent nodes up the tree
          let currentParent = parent;
          while (currentParent) {
            parentNodes.add(currentParent);
            currentParent = this.findParentNode(currentParent, nodes);
          }
        }

        // Continue searching in children
        if (node.children.length > 0) {
          findMatches(node.children, node);
        }
      });
    };

    findMatches(nodes);

    // Mark nodes as visible/expanded
    const markVisible = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        const newNode = { ...node };

        if (matchedNodes.has(node) || parentNodes.has(node)) {
          newNode.visible = true;

          // Expand parent nodes to show matched children
          if (parentNodes.has(node)) {
            newNode.expanded = true;
          }
        } else {
          newNode.visible = false;
        }

        if (node.children.length > 0) {
          newNode.children = markVisible(node.children);
        }

        return newNode;
      });
    };

    const filteredTree = markVisible(nodes);
    return this.flattenTree(filteredTree);
  }

  /**
   * Find parent node in the tree
   */
  private static findParentNode(node: TreeNode, rootNodes: TreeNode[]): TreeNode | null {
    const findInNodes = (nodes: TreeNode[]): TreeNode | null => {
      for (const n of nodes) {
        if (n.children.includes(node)) {
          return n;
        }
        if (n.children.length > 0) {
          const found = findInNodes(n.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInNodes(rootNodes);
  }

  /**
   * Find a node by widget ID
   */
  static findNodeById(widgetId: number, nodes: TreeNode[]): TreeNode | null {
    for (const node of nodes) {
      if (node.widget.id === widgetId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = this.findNodeById(widgetId, node.children);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get all descendant widgets of a node
   */
  static getDescendantWidgets(node: TreeNode): Widget[] {
    const descendants: Widget[] = [];

    const traverse = (n: TreeNode) => {
      n.children.forEach(child => {
        descendants.push(child.widget);
        if (child.children.length > 0) {
          traverse(child);
        }
      });
    };

    traverse(node);
    return descendants;
  }

  /**
   * Check if a widget is a descendant of another
   */
  static isDescendant(widgetId: number, potentialAncestorId: number, widgets: Widget[]): boolean {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return false;

    let currentParentId = widget.parent_widget;
    while (currentParentId) {
      if (currentParentId === potentialAncestorId) {
        return true;
      }
      const parent = widgets.find(w => w.id === currentParentId);
      currentParentId = parent?.parent_widget || null;
    }

    return false;
  }

  /**
   * Get the path from root to a specific widget
   */
  static getWidgetPath(widgetId: number, widgets: Widget[]): Widget[] {
    const path: Widget[] = [];
    const widget = widgets.find(w => w.id === widgetId);

    if (!widget) return path;

    let current: Widget | undefined = widget;
    while (current) {
      path.unshift(current);
      if (current.parent_widget) {
        current = widgets.find(w => w.id === current!.parent_widget);
      } else {
        current = undefined;
      }
    }

    return path;
  }

  /**
   * Validate parent-child relationship
   */
  static canMoveWidget(
    widgetId: number,
    newParentId: number | null,
    widgets: Widget[]
  ): boolean {
    // Can't move widget into itself
    if (widgetId === newParentId) {
      return false;
    }

    // Can't move widget into its own descendant
    if (newParentId && this.isDescendant(newParentId, widgetId, widgets)) {
      return false;
    }

    // Additional validation can be added here
    // e.g., checking if parent widget type can accept children

    return true;
  }

  /**
   * Clone a widget tree (deep copy)
   */
  static cloneWidgetTree(node: TreeNode, idOffset: number = 1000): TreeNode {
    const clonedWidget = {
      ...node.widget,
      id: node.widget.id + idOffset
    };

    const clonedNode: TreeNode = {
      widget: clonedWidget,
      children: [],
      level: node.level,
      expanded: node.expanded,
      visible: node.visible
    };

    // Recursively clone children
    if (node.children.length > 0) {
      clonedNode.children = node.children.map(child =>
        this.cloneWidgetTree(child, idOffset)
      );
    }

    return clonedNode;
  }

  /**
   * Export tree structure to JSON
   */
  static exportTreeToJSON(nodes: TreeNode[]): string {
    const exportNode = (node: TreeNode): any => {
      const exported: any = {
        id: node.widget.id,
        type: node.widget.widget_type,
        order: node.widget.order,
        widget_id: node.widget.widget_id,
        properties: node.widget.properties
      };

      if (node.children.length > 0) {
        exported.children = node.children.map(child => exportNode(child));
      }

      return exported;
    };

    const exportedTree = nodes.map(node => exportNode(node));
    return JSON.stringify(exportedTree, null, 2);
  }

  /**
   * Import tree structure from JSON
   */
  static importTreeFromJSON(json: string, screenId: number): Widget[] {
    const imported = JSON.parse(json);
    const widgets: Widget[] = [];
    let idCounter = 1;

    const importNode = (nodeData: any, parentId: number | null = null): void => {
      const widget: Widget = {
        id: idCounter++,
        screen: screenId,
        widget_type: nodeData.type,
        parent_widget: parentId,
        order: nodeData.order || 0,
        widget_id: nodeData.widget_id,
        properties: nodeData.properties || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      widgets.push(widget);

      if (nodeData.children && Array.isArray(nodeData.children)) {
        nodeData.children.forEach((child: any) => {
          importNode(child, widget.id);
        });
      }
    };

    if (Array.isArray(imported)) {
      imported.forEach(node => importNode(node));
    } else {
      importNode(imported);
    }

    return widgets;
  }
}
