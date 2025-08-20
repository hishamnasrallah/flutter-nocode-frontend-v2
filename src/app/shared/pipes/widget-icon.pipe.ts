// src/app/shared/pipes/widget-icon.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'widgetIcon',
  standalone: true
})
export class WidgetIconPipe implements PipeTransform {
  private iconMap: Record<string, string> = {
    // Layout
    'Column': 'view_column',
    'Row': 'view_stream',
    'Container': 'crop_square',
    'Stack': 'layers',
    'Padding': 'format_indent_increase',
    'Center': 'format_align_center',
    'Expanded': 'unfold_more',
    'Flexible': 'open_in_full',
    'Wrap': 'wrap_text',
    'SizedBox': 'crop_free',
    'AspectRatio': 'aspect_ratio',

    // Display
    'Text': 'text_fields',
    'Image': 'image',
    'Icon': 'emoji_emotions',
    'Card': 'credit_card',
    'Divider': 'remove',
    'ListTile': 'list',

    // Input
    'TextField': 'input',
    'ElevatedButton': 'smart_button',
    'TextButton': 'touch_app',
    'IconButton': 'radio_button_checked',
    'FloatingActionButton': 'add_circle',
    'Switch': 'toggle_on',
    'Checkbox': 'check_box',
    'Radio': 'radio_button_checked',
    'Slider': 'tune',
    'DropdownButton': 'arrow_drop_down',

    // Scrollable
    'ListView': 'list',
    'GridView': 'grid_on',
    'SingleChildScrollView': 'swap_vert',
    'PageView': 'view_carousel',

    // Navigation
    'AppBar': 'web_asset',
    'BottomNavigationBar': 'bottom_navigation',
    'TabBar': 'tab',
    'Drawer': 'menu',
    'Scaffold': 'dashboard',

    // Advanced
    'SafeArea': 'security',
    'GestureDetector': 'touch_app',
    'InkWell': 'touch_app',
    'Hero': 'animation',
    'AnimatedContainer': 'animation',
    'FutureBuilder': 'hourglass_empty',
    'StreamBuilder': 'stream',
    'Form': 'description',
    'FormField': 'text_fields',
    'Dismissible': 'swipe'
  };

  transform(widgetType: string, fallback: string = 'widgets'): string {
    return this.iconMap[widgetType] || fallback;
  }
}
