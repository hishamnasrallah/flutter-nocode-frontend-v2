// src/app/core/models/widget.model.ts

import { WidgetProperty } from './property.model';

export interface Widget {
  id: number;
  screen: number;
  widget_type: WidgetType;
  parent_widget?: number | null;
  order: number;
  widget_id?: string;
  properties?: WidgetProperty[];
  child_widgets?: Widget[];
  can_have_children?: boolean;
  created_at: string;
  updated_at: string;
}

export type WidgetType =
  | 'Column' | 'Row' | 'Container' | 'Padding' | 'Center' | 'Expanded'
  | 'Flexible' | 'Wrap' | 'Stack' | 'Positioned' | 'Text' | 'Image'
  | 'Icon' | 'Divider' | 'Card' | 'ListTile' | 'TextField'
  | 'ElevatedButton' | 'TextButton' | 'IconButton' | 'FloatingActionButton'
  | 'Switch' | 'Checkbox' | 'Radio' | 'Slider' | 'DropdownButton'
  | 'ListView' | 'GridView' | 'SingleChildScrollView' | 'PageView'
  | 'AppBar' | 'BottomNavigationBar' | 'TabBar' | 'Drawer' | 'Scaffold'
  | 'SafeArea' | 'SizedBox' | 'AspectRatio' | 'FutureBuilder' | 'StreamBuilder'
  | 'BottomNavigationBarItem' | 'Form' | 'FormField' | 'GestureDetector'
  | 'InkWell' | 'Dismissible' | 'Hero' | 'AnimatedContainer' | 'FadeTransition';

export interface CreateWidgetRequest {
  screen: number;
  widget_type: WidgetType;
  parent_widget?: number | null;
  order?: number;
  widget_id?: string;
}

export interface UpdateWidgetRequest {
  widget_type?: WidgetType;
  parent_widget?: number | null;
  order?: number;
  widget_id?: string;
}

export interface WidgetListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Widget[];
}

export interface ReorderWidgetRequest {
  new_order: number;
  new_parent?: number | null;
}

export interface MoveWidgetRequest {
  new_parent: number | null;
  new_order: number;
}

export interface WidgetTypeInfo {
  type: WidgetType;
  icon: string;
  description: string;
  category: string;
  can_have_children: boolean;
  default_properties?: Partial<WidgetProperty>[];
}

export interface WidgetCategory {
  name: string;
  icon: string;
  widgets: WidgetTypeInfo[];
}

export const CONTAINER_WIDGETS: WidgetType[] = [
  'Column', 'Row', 'Container', 'Stack', 'Padding', 'Center',
  'Card', 'Scaffold', 'ListView', 'GridView', 'SingleChildScrollView',
  'PageView', 'Wrap', 'Form', 'SafeArea', 'AnimatedContainer',
  'Hero', 'Dismissible', 'GestureDetector', 'InkWell'
];
