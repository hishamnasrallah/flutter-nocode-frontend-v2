// src/app/core/services/widget.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Widget,
  WidgetType,
  WidgetListResponse,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  ReorderWidgetRequest,
  MoveWidgetRequest,
  WidgetCategory,
  CONTAINER_WIDGETS
} from '../models/widget.model';

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private selectedWidgetSubject = new BehaviorSubject<Widget | null>(null);
  public selectedWidget$ = this.selectedWidgetSubject.asObservable();

  private widgetsSubject = new BehaviorSubject<Widget[]>([]);
  public widgets$ = this.widgetsSubject.asObservable();

  private widgetUpdatedSubject = new Subject<Widget>();
  public widgetUpdated$ = this.widgetUpdatedSubject.asObservable();

  private widgetDeletedSubject = new Subject<number>();
  public widgetDeleted$ = this.widgetDeletedSubject.asObservable();

  constructor(private api: ApiService) {}

  get selectedWidget(): Widget | null {
    return this.selectedWidgetSubject.value;
  }

  get widgets(): Widget[] {
    return this.widgetsSubject.value;
  }

  selectWidget(widget: Widget | null): void {
    this.selectedWidgetSubject.next(widget);
  }

  getWidgets(screenId: number): Observable<WidgetListResponse> {
    return this.api.get<WidgetListResponse>('/api/v1/widgets/', {
      screen: screenId
    }).pipe(
      tap(response => {
        this.widgetsSubject.next(response.results);
      })
    );
  }

  getWidget(id: number): Observable<Widget> {
    return this.api.get<Widget>(`/api/v1/widgets/${id}/`);
  }

  createWidget(data: CreateWidgetRequest): Observable<Widget> {
    return this.api.post<Widget>('/api/v1/widgets/', data).pipe(
      tap(widget => {
        const widgets = [...this.widgets, widget];
        this.widgetsSubject.next(widgets);
        this.selectWidget(widget);
      })
    );
  }

  updateWidget(id: number, data: UpdateWidgetRequest): Observable<Widget> {
    return this.api.put<Widget>(`/api/v1/widgets/${id}/`, data).pipe(
      tap(widget => {
        const widgets = this.widgets.map(w => w.id === id ? widget : w);
        this.widgetsSubject.next(widgets);
        this.widgetUpdatedSubject.next(widget);

        if (this.selectedWidget?.id === id) {
          this.selectWidget(widget);
        }
      })
    );
  }

  deleteWidget(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/widgets/${id}/`).pipe(
      tap(() => {
        const widgets = this.widgets.filter(w => w.id !== id);
        this.widgetsSubject.next(widgets);
        this.widgetDeletedSubject.next(id);

        if (this.selectedWidget?.id === id) {
          this.selectWidget(null);
        }
      })
    );
  }

  reorderWidget(id: number, data: ReorderWidgetRequest): Observable<Widget> {
    return this.api.post<Widget>(`/api/v1/widgets/${id}/reorder/`, data).pipe(
      tap(() => {
        // Refresh widgets list
        const screenId = this.widgets.find(w => w.id === id)?.screen;
        if (screenId) {
          this.getWidgets(screenId).subscribe();
        }
      })
    );
  }

  moveWidget(id: number, data: MoveWidgetRequest): Observable<Widget> {
    return this.api.post<Widget>(`/api/v1/widgets/${id}/move/`, data).pipe(
      tap(() => {
        // Refresh widgets list
        const screenId = this.widgets.find(w => w.id === id)?.screen;
        if (screenId) {
          this.getWidgets(screenId).subscribe();
        }
      })
    );
  }

  duplicateWidget(id: number): Observable<Widget> {
    return this.api.post<Widget>(`/api/v1/widgets/${id}/duplicate/`, {}).pipe(
      tap(widget => {
        const widgets = [...this.widgets, widget];
        this.widgetsSubject.next(widgets);
      })
    );
  }

  getWidgetTypes(): Observable<any> {
    return this.api.get('/api/v1/widgets/widget_types/');
  }

  bulkCreateWidgets(widgets: CreateWidgetRequest[]): Observable<Widget[]> {
    return this.api.post<Widget[]>('/api/v1/widgets/bulk_create/', { widgets }).pipe(
      tap(newWidgets => {
        const widgets = [...this.widgets, ...newWidgets];
        this.widgetsSubject.next(widgets);
      })
    );
  }

  // Helper methods
  canAcceptChildren(widgetType: WidgetType): boolean {
    return CONTAINER_WIDGETS.includes(widgetType);
  }

  isValidParent(childType: WidgetType, parentType: WidgetType | null): boolean {
    if (!parentType) return true;
    return this.canAcceptChildren(parentType);
  }

  getWidgetTree(widgets: Widget[]): Widget[] {
    const widgetMap = new Map<number, Widget>();
    const rootWidgets: Widget[] = [];

    // First pass: create map
    widgets.forEach(widget => {
      widgetMap.set(widget.id, { ...widget, child_widgets: [] });
    });

    // Second pass: build tree
    widgets.forEach(widget => {
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
    return rootWidgets;
  }

  findWidgetById(id: number, widgets: Widget[]): Widget | null {
    for (const widget of widgets) {
      if (widget.id === id) return widget;
      if (widget.child_widgets) {
        const found = this.findWidgetById(id, widget.child_widgets);
        if (found) return found;
      }
    }
    return null;
  }

  getWidgetCategories(): WidgetCategory[] {
    return [
      {
        name: 'Layout',
        icon: 'dashboard',
        widgets: [
          { type: 'Column', icon: 'view_column', description: 'Vertical layout', category: 'Layout', can_have_children: true },
          { type: 'Row', icon: 'view_stream', description: 'Horizontal layout', category: 'Layout', can_have_children: true },
          { type: 'Container', icon: 'crop_square', description: 'Box container', category: 'Layout', can_have_children: true },
          { type: 'Stack', icon: 'layers', description: 'Layered widgets', category: 'Layout', can_have_children: true },
          { type: 'Padding', icon: 'format_indent_increase', description: 'Add spacing', category: 'Layout', can_have_children: true },
          { type: 'Center', icon: 'format_align_center', description: 'Center content', category: 'Layout', can_have_children: true },
          { type: 'Expanded', icon: 'unfold_more', description: 'Fill available space', category: 'Layout', can_have_children: false },
          { type: 'Wrap', icon: 'wrap_text', description: 'Wrap content', category: 'Layout', can_have_children: true },
          { type: 'SizedBox', icon: 'crop_free', description: 'Fixed size box', category: 'Layout', can_have_children: true },
          { type: 'AspectRatio', icon: 'aspect_ratio', description: 'Maintain aspect ratio', category: 'Layout', can_have_children: true }
        ]
      },
      {
        name: 'Display',
        icon: 'visibility',
        widgets: [
          { type: 'Text', icon: 'text_fields', description: 'Display text', category: 'Display', can_have_children: false },
          { type: 'Image', icon: 'image', description: 'Show image', category: 'Display', can_have_children: false },
          { type: 'Icon', icon: 'emoji_emotions', description: 'Display icon', category: 'Display', can_have_children: false },
          { type: 'Card', icon: 'credit_card', description: 'Material card', category: 'Display', can_have_children: true },
          { type: 'Divider', icon: 'remove', description: 'Line separator', category: 'Display', can_have_children: false },
          { type: 'ListTile', icon: 'list', description: 'List item', category: 'Display', can_have_children: false }
        ]
      },
      {
        name: 'Input',
        icon: 'input',
        widgets: [
          { type: 'TextField', icon: 'text_fields', description: 'Text input', category: 'Input', can_have_children: false },
          { type: 'ElevatedButton', icon: 'smart_button', description: 'Raised button', category: 'Input', can_have_children: false },
          { type: 'TextButton', icon: 'touch_app', description: 'Flat button', category: 'Input', can_have_children: false },
          { type: 'IconButton', icon: 'touch_app', description: 'Icon button', category: 'Input', can_have_children: false },
          { type: 'Switch', icon: 'toggle_on', description: 'Toggle switch', category: 'Input', can_have_children: false },
          { type: 'Checkbox', icon: 'check_box', description: 'Checkbox', category: 'Input', can_have_children: false },
          { type: 'Radio', icon: 'radio_button_checked', description: 'Radio button', category: 'Input', can_have_children: false },
          { type: 'Slider', icon: 'tune', description: 'Value slider', category: 'Input', can_have_children: false },
          { type: 'DropdownButton', icon: 'arrow_drop_down', description: 'Dropdown menu', category: 'Input', can_have_children: false }
        ]
      },
      {
        name: 'Scrollable',
        icon: 'swap_vert',
        widgets: [
          { type: 'ListView', icon: 'list', description: 'Scrollable list', category: 'Scrollable', can_have_children: true },
          { type: 'GridView', icon: 'grid_on', description: 'Grid layout', category: 'Scrollable', can_have_children: true },
          { type: 'SingleChildScrollView', icon: 'swap_vert', description: 'Scrollable area', category: 'Scrollable', can_have_children: true },
          { type: 'PageView', icon: 'view_carousel', description: 'Swipeable pages', category: 'Scrollable', can_have_children: true }
        ]
      },
      {
        name: 'Navigation',
        icon: 'navigation',
        widgets: [
          { type: 'AppBar', icon: 'web_asset', description: 'App bar', category: 'Navigation', can_have_children: false },
          { type: 'BottomNavigationBar', icon: 'bottom_navigation', description: 'Bottom navigation', category: 'Navigation', can_have_children: false },
          { type: 'TabBar', icon: 'tab', description: 'Tab bar', category: 'Navigation', can_have_children: false },
          { type: 'Drawer', icon: 'menu', description: 'Side drawer', category: 'Navigation', can_have_children: true }
        ]
      },
      {
        name: 'Advanced',
        icon: 'settings',
        widgets: [
          { type: 'GestureDetector', icon: 'touch_app', description: 'Detect gestures', category: 'Advanced', can_have_children: true },
          { type: 'InkWell', icon: 'touch_app', description: 'Ripple effect', category: 'Advanced', can_have_children: true },
          { type: 'Hero', icon: 'animation', description: 'Hero animation', category: 'Advanced', can_have_children: true },
          { type: 'AnimatedContainer', icon: 'animation', description: 'Animated container', category: 'Advanced', can_have_children: true },
          { type: 'FutureBuilder', icon: 'hourglass_empty', description: 'Build from future', category: 'Advanced', can_have_children: false },
          { type: 'StreamBuilder', icon: 'stream', description: 'Build from stream', category: 'Advanced', can_have_children: false }
        ]
      }
    ];
  }
}
