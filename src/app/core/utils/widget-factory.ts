// src/app/core/utils/widget-factory.ts

import { WidgetType } from '../models/widget.model';
import { WidgetProperty, PropertyType } from '../models/property.model';

export class WidgetFactory {
  static createDefaultProperties(widgetType: WidgetType): Partial<WidgetProperty>[] {
    const baseProps: Partial<WidgetProperty>[] = [];

    switch (widgetType) {
      // Layout Widgets
      case 'Column':
        return [
          { property_name: 'mainAxisAlignment', property_type: 'string', string_value: 'start' },
          { property_name: 'crossAxisAlignment', property_type: 'string', string_value: 'center' },
          { property_name: 'mainAxisSize', property_type: 'string', string_value: 'max' }
        ];

      case 'Row':
        return [
          { property_name: 'mainAxisAlignment', property_type: 'string', string_value: 'start' },
          { property_name: 'crossAxisAlignment', property_type: 'string', string_value: 'center' },
          { property_name: 'mainAxisSize', property_type: 'string', string_value: 'max' }
        ];

      case 'Container':
        return [
          { property_name: 'width', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'height', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 8 },
          { property_name: 'margin', property_type: 'decimal', decimal_value: 0 },
          { property_name: 'color', property_type: 'color', color_value: '#FFFFFF' },
          { property_name: 'borderRadius', property_type: 'decimal', decimal_value: 0 }
        ];

      case 'Stack':
        return [
          { property_name: 'alignment', property_type: 'alignment', alignment_value: 'topLeft' },
          { property_name: 'fit', property_type: 'string', string_value: 'loose' }
        ];

      case 'Padding':
        return [
          { property_name: 'padding', property_type: 'decimal', decimal_value: 16 },
          { property_name: 'paddingTop', property_type: 'decimal', decimal_value: 16 },
          { property_name: 'paddingRight', property_type: 'decimal', decimal_value: 16 },
          { property_name: 'paddingBottom', property_type: 'decimal', decimal_value: 16 },
          { property_name: 'paddingLeft', property_type: 'decimal', decimal_value: 16 }
        ];

      case 'Center':
        return [
          { property_name: 'widthFactor', property_type: 'decimal', decimal_value: 1.0 },
          { property_name: 'heightFactor', property_type: 'decimal', decimal_value: 1.0 }
        ];

      case 'Expanded':
        return [
          { property_name: 'flex', property_type: 'integer', integer_value: 1 }
        ];

      case 'Wrap':
        return [
          { property_name: 'direction', property_type: 'string', string_value: 'horizontal' },
          { property_name: 'alignment', property_type: 'string', string_value: 'start' },
          { property_name: 'spacing', property_type: 'decimal', decimal_value: 8 },
          { property_name: 'runSpacing', property_type: 'decimal', decimal_value: 8 }
        ];

      case 'SizedBox':
        return [
          { property_name: 'width', property_type: 'decimal', decimal_value: 100 },
          { property_name: 'height', property_type: 'decimal', decimal_value: 100 }
        ];

      case 'AspectRatio':
        return [
          { property_name: 'aspectRatio', property_type: 'decimal', decimal_value: 1.0 }
        ];

      // Display Widgets
      case 'Text':
        return [
          { property_name: 'text', property_type: 'string', string_value: 'Hello World' },
          { property_name: 'fontSize', property_type: 'decimal', decimal_value: 14 },
          { property_name: 'fontWeight', property_type: 'string', string_value: 'normal' },
          { property_name: 'color', property_type: 'color', color_value: '#000000' },
          { property_name: 'textAlign', property_type: 'alignment', alignment_value: 'left' },
          { property_name: 'overflow', property_type: 'string', string_value: 'visible' }
        ];

      case 'Image':
        return [
          { property_name: 'imageUrl', property_type: 'url', url_value: '' },
          { property_name: 'width', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'height', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'fit', property_type: 'string', string_value: 'cover' },
          { property_name: 'altText', property_type: 'string', string_value: 'Image' }
        ];

      case 'Icon':
        return [
          { property_name: 'icon', property_type: 'icon', string_value: 'star' },
          { property_name: 'size', property_type: 'decimal', decimal_value: 24 },
          { property_name: 'color', property_type: 'color', color_value: '#000000' }
        ];

      case 'Card':
        return [
          { property_name: 'elevation', property_type: 'integer', integer_value: 2 },
          { property_name: 'borderRadius', property_type: 'decimal', decimal_value: 4 },
          { property_name: 'color', property_type: 'color', color_value: '#FFFFFF' },
          { property_name: 'margin', property_type: 'decimal', decimal_value: 4 }
        ];

      case 'Divider':
        return [
          { property_name: 'color', property_type: 'color', color_value: '#E0E0E0' },
          { property_name: 'thickness', property_type: 'decimal', decimal_value: 1 },
          { property_name: 'indent', property_type: 'decimal', decimal_value: 0 },
          { property_name: 'endIndent', property_type: 'decimal', decimal_value: 0 }
        ];

      case 'ListTile':
        return [
          { property_name: 'title', property_type: 'string', string_value: 'List Item' },
          { property_name: 'subtitle', property_type: 'string', string_value: '' },
          { property_name: 'leading', property_type: 'icon', string_value: 'account_circle' },
          { property_name: 'trailing', property_type: 'icon', string_value: 'arrow_forward_ios' },
          { property_name: 'dense', property_type: 'boolean', boolean_value: false }
        ];

      // Input Widgets
      case 'TextField':
        return [
          { property_name: 'hintText', property_type: 'string', string_value: 'Enter text...' },
          { property_name: 'labelText', property_type: 'string', string_value: 'Label' },
          { property_name: 'helperText', property_type: 'string', string_value: '' },
          { property_name: 'errorText', property_type: 'string', string_value: '' },
          { property_name: 'keyboardType', property_type: 'string', string_value: 'text' },
          { property_name: 'obscureText', property_type: 'boolean', boolean_value: false },
          { property_name: 'maxLength', property_type: 'integer', integer_value: 100 },
          { property_name: 'maxLines', property_type: 'integer', integer_value: 1 },
          { property_name: 'filled', property_type: 'boolean', boolean_value: false },
          { property_name: 'fillColor', property_type: 'color', color_value: '#F5F5F5' },
          { property_name: 'borderStyle', property_type: 'string', string_value: 'outline' }
        ];

      case 'ElevatedButton':
        return [
          { property_name: 'text', property_type: 'string', string_value: 'Button' },
          { property_name: 'backgroundColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'foregroundColor', property_type: 'color', color_value: '#FFFFFF' },
          { property_name: 'elevation', property_type: 'integer', integer_value: 2 },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 16 },
          { property_name: 'borderRadius', property_type: 'decimal', decimal_value: 4 }
        ];

      case 'TextButton':
        return [
          { property_name: 'text', property_type: 'string', string_value: 'Text Button' },
          { property_name: 'textColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 8 }
        ];

      case 'IconButton':
        return [
          { property_name: 'icon', property_type: 'icon', string_value: 'favorite' },
          { property_name: 'iconColor', property_type: 'color', color_value: '#000000' },
          { property_name: 'iconSize', property_type: 'decimal', decimal_value: 24 },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 8 }
        ];

      case 'Switch':
        return [
          { property_name: 'value', property_type: 'boolean', boolean_value: false },
          { property_name: 'activeColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'inactiveColor', property_type: 'color', color_value: '#9E9E9E' }
        ];

      case 'Checkbox':
        return [
          { property_name: 'value', property_type: 'boolean', boolean_value: false },
          { property_name: 'label', property_type: 'string', string_value: 'Checkbox' },
          { property_name: 'activeColor', property_type: 'color', color_value: '#2196F3' }
        ];

      case 'Radio':
        return [
          { property_name: 'value', property_type: 'boolean', boolean_value: false },
          { property_name: 'label', property_type: 'string', string_value: 'Radio' },
          { property_name: 'activeColor', property_type: 'color', color_value: '#2196F3' }
        ];

      case 'Slider':
        return [
          { property_name: 'value', property_type: 'decimal', decimal_value: 50 },
          { property_name: 'min', property_type: 'decimal', decimal_value: 0 },
          { property_name: 'max', property_type: 'decimal', decimal_value: 100 },
          { property_name: 'divisions', property_type: 'integer', integer_value: 10 },
          { property_name: 'activeColor', property_type: 'color', color_value: '#2196F3' }
        ];

      case 'DropdownButton':
        return [
          { property_name: 'value', property_type: 'string', string_value: 'Option 1' },
          { property_name: 'items', property_type: 'json', json_value: '["Option 1", "Option 2", "Option 3"]' },
          { property_name: 'hint', property_type: 'string', string_value: 'Select an option' }
        ];

      // Scrollable Widgets
      case 'ListView':
        return [
          { property_name: 'scrollDirection', property_type: 'string', string_value: 'vertical' },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 0 },
          { property_name: 'itemExtent', property_type: 'decimal', decimal_value: 0 },
          { property_name: 'shrinkWrap', property_type: 'boolean', boolean_value: false }
        ];

      case 'GridView':
        return [
          { property_name: 'crossAxisCount', property_type: 'integer', integer_value: 2 },
          { property_name: 'crossAxisSpacing', property_type: 'decimal', decimal_value: 8 },
          { property_name: 'mainAxisSpacing', property_type: 'decimal', decimal_value: 8 },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 8 }
        ];

      case 'SingleChildScrollView':
        return [
          { property_name: 'scrollDirection', property_type: 'string', string_value: 'vertical' },
          { property_name: 'padding', property_type: 'decimal', decimal_value: 0 }
        ];

      case 'PageView':
        return [
          { property_name: 'scrollDirection', property_type: 'string', string_value: 'horizontal' },
          { property_name: 'pageSnapping', property_type: 'boolean', boolean_value: true }
        ];

      // Navigation Widgets
      case 'AppBar':
        return [
          { property_name: 'title', property_type: 'string', string_value: 'App Bar' },
          { property_name: 'backgroundColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'elevation', property_type: 'integer', integer_value: 4 },
          { property_name: 'centerTitle', property_type: 'boolean', boolean_value: false }
        ];

      case 'BottomNavigationBar':
        return [
          { property_name: 'backgroundColor', property_type: 'color', color_value: '#FFFFFF' },
          { property_name: 'selectedItemColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'unselectedItemColor', property_type: 'color', color_value: '#757575' },
          { property_name: 'type', property_type: 'string', string_value: 'fixed' }
        ];

      case 'TabBar':
        return [
          { property_name: 'indicatorColor', property_type: 'color', color_value: '#2196F3' },
          { property_name: 'labelColor', property_type: 'color', color_value: '#000000' },
          { property_name: 'unselectedLabelColor', property_type: 'color', color_value: '#757575' },
          { property_name: 'isScrollable', property_type: 'boolean', boolean_value: false }
        ];

      case 'Drawer':
        return [
          { property_name: 'backgroundColor', property_type: 'color', color_value: '#FFFFFF' },
          { property_name: 'elevation', property_type: 'integer', integer_value: 16 },
          { property_name: 'width', property_type: 'decimal', decimal_value: 280 }
        ];

      // Advanced Widgets
      case 'GestureDetector':
      case 'InkWell':
        return [
          { property_name: 'onTap', property_type: 'action_reference' },
          { property_name: 'onDoubleTap', property_type: 'action_reference' },
          { property_name: 'onLongPress', property_type: 'action_reference' }
        ];

      case 'Hero':
        return [
          { property_name: 'tag', property_type: 'string', string_value: 'hero-tag' }
        ];

      case 'AnimatedContainer':
        return [
          { property_name: 'duration', property_type: 'integer', integer_value: 300 },
          { property_name: 'curve', property_type: 'string', string_value: 'ease' },
          { property_name: 'width', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'height', property_type: 'decimal', decimal_value: 200 },
          { property_name: 'color', property_type: 'color', color_value: '#FFFFFF' }
        ];

      case 'FutureBuilder':
        return [
          { property_name: 'dataSource', property_type: 'data_source_field_reference' }
        ];

      case 'StreamBuilder':
        return [
          { property_name: 'dataSource', property_type: 'data_source_field_reference' }
        ];

      default:
        return baseProps;
    }
  }

  static getWidgetIcon(widgetType: WidgetType): string {
    const iconMap: Record<WidgetType, string> = {
      // Layout
      'Column': 'view_column',
      'Row': 'view_stream',
      'Container': 'crop_square',
      'Stack': 'layers',
      'Padding': 'format_indent_increase',
      'Center': 'format_align_center',
      'Expanded': 'unfold_more',
      'Flexible': 'unfold_more',
      'Wrap': 'wrap_text',
      'Positioned': 'place',
      'SizedBox': 'crop_free',
      'AspectRatio': 'aspect_ratio',
      'SafeArea': 'security',

      // Display
      'Text': 'text_fields',
      'Image': 'image',
      'Icon': 'emoji_emotions',
      'Divider': 'remove',
      'Card': 'credit_card',
      'ListTile': 'list',

      // Input
      'TextField': 'text_fields',
      'ElevatedButton': 'smart_button',
      'TextButton': 'touch_app',
      'IconButton': 'touch_app',
      'FloatingActionButton': 'add_circle',
      'Switch': 'toggle_on',
      'Checkbox': 'check_box',
      'Radio': 'radio_button_checked',
      'Slider': 'tune',
      'DropdownButton': 'arrow_drop_down',
      'Form': 'description',
      'FormField': 'input',

      // Scrollable
      'ListView': 'list',
      'GridView': 'grid_on',
      'SingleChildScrollView': 'swap_vert',
      'PageView': 'view_carousel',

      // Navigation
      'AppBar': 'web_asset',
      'BottomNavigationBar': 'bottom_navigation',
      'BottomNavigationBarItem': 'tab',
      'TabBar': 'tab',
      'Drawer': 'menu',
      'Scaffold': 'dashboard',

      // Advanced
      'GestureDetector': 'touch_app',
      'InkWell': 'touch_app',
      'Dismissible': 'swipe',
      'Hero': 'animation',
      'AnimatedContainer': 'animation',
      'FadeTransition': 'gradient',
      'FutureBuilder': 'hourglass_empty',
      'StreamBuilder': 'stream'
    };

    return iconMap[widgetType] || 'widgets';
  }

  static canHaveChildren(widgetType: WidgetType): boolean {
    const containerWidgets: WidgetType[] = [
      'Column', 'Row', 'Container', 'Stack', 'Padding', 'Center',
      'Card', 'Scaffold', 'ListView', 'GridView', 'SingleChildScrollView',
      'PageView', 'Wrap', 'Form', 'SafeArea', 'AnimatedContainer',
      'Hero', 'Dismissible', 'GestureDetector', 'InkWell', 'Drawer',
      'Expanded', 'Flexible', 'Positioned', 'SizedBox', 'AspectRatio'
    ];

    return containerWidgets.includes(widgetType);
  }

  static getWidgetCategory(widgetType: WidgetType): string {
    const categories: Record<string, WidgetType[]> = {
      'Layout': [
        'Column', 'Row', 'Container', 'Stack', 'Padding', 'Center',
        'Expanded', 'Flexible', 'Wrap', 'Positioned', 'SizedBox',
        'AspectRatio', 'SafeArea'
      ],
      'Display': [
        'Text', 'Image', 'Icon', 'Divider', 'Card', 'ListTile'
      ],
      'Input': [
        'TextField', 'ElevatedButton', 'TextButton', 'IconButton',
        'FloatingActionButton', 'Switch', 'Checkbox', 'Radio',
        'Slider', 'DropdownButton', 'Form', 'FormField'
      ],
      'Scrollable': [
        'ListView', 'GridView', 'SingleChildScrollView', 'PageView'
      ],
      'Navigation': [
        'AppBar', 'BottomNavigationBar', 'BottomNavigationBarItem',
        'TabBar', 'Drawer', 'Scaffold'
      ],
      'Advanced': [
        'GestureDetector', 'InkWell', 'Dismissible', 'Hero',
        'AnimatedContainer', 'FadeTransition', 'FutureBuilder', 'StreamBuilder'
      ]
    };

    for (const [category, widgets] of Object.entries(categories)) {
      if (widgets.includes(widgetType)) {
        return category;
      }
    }

    return 'Other';
  }

  static getDefaultSize(widgetType: WidgetType): { width?: number; height?: number } {
    const sizes: Partial<Record<WidgetType, { width?: number; height?: number }>> = {
      'Container': { width: 200, height: 200 },
      'SizedBox': { width: 100, height: 100 },
      'Image': { width: 200, height: 200 },
      'Card': { width: 300, height: 150 },
      'TextField': { width: 250, height: 56 },
      'ElevatedButton': { width: 120, height: 48 },
      'TextButton': { width: 100, height: 36 },
      'IconButton': { width: 48, height: 48 },
      'ListView': { width: 300, height: 400 },
      'GridView': { width: 300, height: 400 },
      'AppBar': { height: 56 },
      'BottomNavigationBar': { height: 56 },
      'Drawer': { width: 280 }
    };

    return sizes[widgetType] || {};
  }
}
