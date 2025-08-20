// src/app/features/builder/properties-panel/properties-panel.component.ts

import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Widget } from '../../../core/models/widget.model';
import { PropertyService } from '../../../core/services/property.service';
import { WidgetProperty, PropertyType } from '../../../core/models/property.model';

interface PropertyGroup {
  name: string;
  properties: WidgetProperty[];
}

interface AlignmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent implements OnChanges {
  @Input() widget: Widget | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  propertyGroups: PropertyGroup[] = [];
  expandedGroups: Set<string> = new Set(['Content', 'Style']);

  // Debounce subjects for text inputs
  private textChangeSubject = new Subject<{ property: WidgetProperty; value: any }>();
  private jsonChangeSubject = new Subject<{ property: WidgetProperty; value: string }>();

  // UI state
  activeColorPicker: number | null = null;
  activeIconPicker: number | null = null;
  iconSearchQuery = '';
  filteredIcons: string[] = [];

  // Material colors palette
  materialColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#000000'
  ];

  // Material icons list
  allIcons = [
    'home', 'search', 'menu', 'close', 'settings', 'favorite', 'star', 'delete',
    'add', 'remove', 'edit', 'save', 'refresh', 'arrow_back', 'arrow_forward',
    'check', 'clear', 'visibility', 'visibility_off', 'account_circle', 'face',
    'done', 'info', 'warning', 'error', 'help', 'lock', 'lock_open', 'https',
    'email', 'phone', 'place', 'schedule', 'language', 'dashboard', 'assessment',
    'trending_up', 'trending_down', 'shopping_cart', 'store', 'credit_card',
    'work', 'business', 'school', 'local_hospital', 'hotel', 'restaurant',
    'directions_car', 'directions_bus', 'flight', 'navigation', 'map', 'terrain',
    'play_arrow', 'pause', 'stop', 'skip_previous', 'skip_next', 'volume_up',
    'videocam', 'photo_camera', 'photo', 'music_note', 'headset', 'mic',
    'cloud', 'cloud_download', 'cloud_upload', 'folder', 'insert_drive_file',
    'create_new_folder', 'attachment', 'link', 'send', 'drafts', 'inbox',
    'report', 'forum', 'chat', 'message', 'notifications', 'group', 'person_add'
  ];

  // Alignment options
  alignmentOptions: AlignmentOption[] = [
    { value: 'topLeft', label: 'Top Left' },
    { value: 'topCenter', label: 'Top Center' },
    { value: 'topRight', label: 'Top Right' },
    { value: 'centerLeft', label: 'Center Left' },
    { value: 'center', label: 'Center' },
    { value: 'centerRight', label: 'Center Right' },
    { value: 'bottomLeft', label: 'Bottom Left' },
    { value: 'bottomCenter', label: 'Bottom Center' },
    { value: 'bottomRight', label: 'Bottom Right' }
  ];

  // Reference data
  availableActions: any[] = [];
  availableScreens: any[] = [];
  availableDataSources: any[] = [];

  // Property definitions by widget type
  private propertyDefinitions: Record<string, PropertyGroup[]> = {
    'Text': [
      { name: 'Content', properties: [] },
      { name: 'Style', properties: [] }
    ],
    'Container': [
      { name: 'Layout', properties: [] },
      { name: 'Decoration', properties: [] },
      { name: 'Effects', properties: [] }
    ],
    'ElevatedButton': [
      { name: 'Content', properties: [] },
      { name: 'Style', properties: [] }
    ],
    'Image': [
      { name: 'Source', properties: [] },
      { name: 'Size', properties: [] }
    ],
    'TextField': [
      { name: 'Content', properties: [] },
      { name: 'Input', properties: [] },
      { name: 'Style', properties: [] }
    ],
    'Column': [
      { name: 'Layout', properties: [] }
    ],
    'Row': [
      { name: 'Layout', properties: [] }
    ],
    'Icon': [
      { name: 'Content', properties: [] }
    ],
    'Padding': [
      { name: 'Spacing', properties: [] }
    ]
  };

  constructor(private propertyService: PropertyService) {
    this.setupDebouncing();
    this.filteredIcons = [...this.allIcons];
  }

  ngOnChanges(): void {
    if (this.widget) {
      this.loadPropertyGroups();
      this.loadReferenceData();
    }
  }

  private setupDebouncing(): void {
    // Debounce text inputs
    this.textChangeSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.property.id === curr.property.id && prev.value === curr.value
      )
    ).subscribe(({ property, value }) => {
      this.updateProperty(property, value);
    });

    // Debounce JSON inputs
    this.jsonChangeSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(({ property, value }) => {
      if (this.isJsonValid(value)) {
        this.updateProperty(property, value);
      }
    });
  }

  loadPropertyGroups(): void {
    if (!this.widget) return;

    // Get properties for this widget
    const widgetProperties = this.widget.properties || [];

    // Get default groups for widget type
    const defaultGroups = this.propertyDefinitions[this.widget.widget_type] || [
      { name: 'Properties', properties: [] }
    ];

    // Group properties by category
    const groupedProps = new Map<string, WidgetProperty[]>();

    widgetProperties.forEach(prop => {
      const category = this.getPropertyCategory(prop);
      if (!groupedProps.has(category)) {
        groupedProps.set(category, []);
      }
      groupedProps.get(category)!.push(prop);
    });

    // Create property groups
    this.propertyGroups = Array.from(groupedProps.entries()).map(([name, properties]) => ({
      name,
      properties: properties.sort((a, b) => a.property_name.localeCompare(b.property_name))
    }));

    // Ensure default groups exist even if empty
    defaultGroups.forEach(group => {
      if (!this.propertyGroups.find(g => g.name === group.name)) {
        this.propertyGroups.push({ name: group.name, properties: [] });
      }
    });
  }

  private getPropertyCategory(property: WidgetProperty): string {
    // Map property names to categories
    const categoryMap: Record<string, string> = {
      // Content properties
      'text': 'Content',
      'hintText': 'Content',
      'labelText': 'Content',
      'helperText': 'Content',
      'errorText': 'Content',
      'imageUrl': 'Content',
      'altText': 'Content',
      'icon': 'Content',
      'overflow': 'Content',

      // Layout properties
      'width': 'Layout',
      'height': 'Layout',
      'padding': 'Layout',
      'margin': 'Layout',
      'alignment': 'Layout',
      'mainAxisAlignment': 'Layout',
      'crossAxisAlignment': 'Layout',
      'mainAxisSize': 'Layout',
      'fit': 'Layout',

      // Style properties
      'fontSize': 'Style',
      'fontWeight': 'Style',
      'fontStyle': 'Style',
      'color': 'Style',
      'textAlign': 'Style',
      'backgroundColor': 'Style',
      'foregroundColor': 'Style',
      'fillColor': 'Style',
      'borderStyle': 'Style',

      // Decoration properties
      'borderRadius': 'Decoration',
      'borderWidth': 'Decoration',
      'borderColor': 'Decoration',

      // Effects properties
      'elevation': 'Effects',

      // Input properties
      'keyboardType': 'Input',
      'obscureText': 'Input',
      'maxLength': 'Input',
      'maxLines': 'Input',
      'filled': 'Input',

      // Spacing properties
      'paddingTop': 'Spacing',
      'paddingRight': 'Spacing',
      'paddingBottom': 'Spacing',
      'paddingLeft': 'Spacing',

      // Action properties
      'onPressed': 'Actions',
      'onTap': 'Actions',
      'onChanged': 'Actions'
    };

    return categoryMap[property.property_name] || 'Properties';
  }

  private loadReferenceData(): void {
    // TODO: Load actions, screens, and data sources from services
    this.availableActions = [
      { id: 1, name: 'Navigate to Home' },
      { id: 2, name: 'Show Dialog' },
      { id: 3, name: 'Submit Form' }
    ];

    this.availableScreens = [
      { id: 1, name: 'Home', route_name: '/home' },
      { id: 2, name: 'Profile', route_name: '/profile' },
      { id: 3, name: 'Settings', route_name: '/settings' }
    ];

    this.availableDataSources = [
      {
        id: 1,
        name: 'Users API',
        fields: [
          { id: 1, display_name: 'User ID' },
          { id: 2, display_name: 'Username' },
          { id: 3, display_name: 'Email' }
        ]
      }
    ];
  }

  onPropertyChange(property: WidgetProperty, event: any): void {
    const value = this.extractValue(event, property.property_type);

    if (property.property_type === 'string' ||
        property.property_type === 'url' ||
        property.property_type === 'map_location') {
      // Debounce text inputs
      this.textChangeSubject.next({ property, value });
    } else {
      // Update immediately for other types
      this.updateProperty(property, value);
    }
  }

  private extractValue(event: any, propertyType: PropertyType): any {
    if (event.target) {
      switch (propertyType) {
        case 'boolean':
          return event.target.checked;
        case 'integer':
          return parseInt(event.target.value, 10) || 0;
        case 'decimal':
          return parseFloat(event.target.value) || 0;
        default:
          return event.target.value;
      }
    }
    return event;
  }

  private updateProperty(property: WidgetProperty, value: any): void {
    const updateData = this.propertyService.createUpdateRequest(property.property_type, value);
    this.propertyService.queuePropertyUpdate(property.id, updateData);
  }

  getPropertyValue(property: WidgetProperty): any {
    return this.propertyService.getPropertyValue(property);
  }

  resetProperty(property: WidgetProperty): void {
    const defaultValue = this.getDefaultValue(property);
    this.updateProperty(property, defaultValue);
  }

  private getDefaultValue(property: WidgetProperty): any {
    // Define default values based on property type and name
    const defaults: Record<string, any> = {
      'fontSize': 14,
      'fontWeight': 'normal',
      'color': '#000000',
      'backgroundColor': '#FFFFFF',
      'padding': 8,
      'margin': 0,
      'borderRadius': 0,
      'borderWidth': 0,
      'elevation': 0,
      'width': null,
      'height': null,
      'maxLines': 1,
      'filled': false,
      'obscureText': false,
      'showAppBar': true,
      'showBackButton': false
    };

    return defaults[property.property_name] ?? null;
  }

  hasDefaultValue(property: WidgetProperty): boolean {
    const currentValue = this.getPropertyValue(property);
    const defaultValue = this.getDefaultValue(property);
    return currentValue !== defaultValue;
  }

  deleteWidget(): void {
    if (this.widget && confirm('Are you sure you want to delete this widget?')) {
      // TODO: Emit delete event or call widget service
      console.log('Delete widget:', this.widget.id);
    }
  }

  toggleGroup(groupName: string): void {
    if (this.expandedGroups.has(groupName)) {
      this.expandedGroups.delete(groupName);
    } else {
      this.expandedGroups.add(groupName);
    }
  }

  getWidgetIcon(): string {
    const iconMap: Record<string, string> = {
      'Text': 'text_fields',
      'Container': 'crop_square',
      'Row': 'view_stream',
      'Column': 'view_column',
      'ElevatedButton': 'smart_button',
      'Image': 'image',
      'Icon': 'emoji_emotions',
      'TextField': 'text_fields',
      'Padding': 'format_indent_increase',
      'Center': 'format_align_center',
      'Card': 'credit_card',
      'ListView': 'list',
      'GridView': 'grid_on'
    };

    return iconMap[this.widget?.widget_type || ''] || 'widgets';
  }

  getPropertySuffix(property: WidgetProperty): string {
    const suffixMap: Record<string, string> = {
      'width': 'px',
      'height': 'px',
      'padding': 'px',
      'margin': 'px',
      'fontSize': 'px',
      'borderRadius': 'px',
      'borderWidth': 'px'
    };

    return suffixMap[property.property_name] || '';
  }

  incrementValue(property: WidgetProperty, delta: number): void {
    const currentValue = this.getPropertyValue(property) || 0;
    const newValue = currentValue + delta;
    this.updateProperty(property, Math.max(0, newValue));
  }

  // Color picker methods
  toggleColorPicker(property: WidgetProperty): void {
    this.activeColorPicker = this.activeColorPicker === property.id ? null : property.id;
    this.activeIconPicker = null;
  }

  selectColor(property: WidgetProperty, color: string): void {
    this.updateProperty(property, color);
    this.activeColorPicker = null;
  }

  onColorInputChange(property: WidgetProperty, event: any): void {
    const value = event.target.value;
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      this.updateProperty(property, value);
    }
  }

  // Icon picker methods
  toggleIconPicker(property: WidgetProperty): void {
    this.activeIconPicker = this.activeIconPicker === property.id ? null : property.id;
    this.activeColorPicker = null;
    this.iconSearchQuery = '';
    this.filteredIcons = [...this.allIcons];
  }

  filterIcons(): void {
    if (!this.iconSearchQuery) {
      this.filteredIcons = [...this.allIcons];
    } else {
      const query = this.iconSearchQuery.toLowerCase();
      this.filteredIcons = this.allIcons.filter(icon =>
        icon.toLowerCase().includes(query)
      );
    }
  }

  selectIcon(property: WidgetProperty, icon: string): void {
    this.updateProperty(property, icon);
    this.activeIconPicker = null;
  }

  // Alignment methods
  selectAlignment(property: WidgetProperty, alignment: string): void {
    this.updateProperty(property, alignment);
  }

  // URL validation
  isUrlValid(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  validateUrl(property: WidgetProperty): void {
    const url = this.getPropertyValue(property);
    if (!this.isUrlValid(url)) {
      alert('Invalid URL format');
    }
  }

  // JSON methods
  formatJson(value: string): string {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  isJsonValid(value: string): boolean {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  onJsonChange(property: WidgetProperty, event: any): void {
    const value = event.target.value;
    this.jsonChangeSubject.next({ property, value });
  }

  // File upload methods
  openFileUpload(property: WidgetProperty): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(property: WidgetProperty, event: any): void {
    const file = event.target.files[0];
    if (file) {
      // TODO: Upload file and get URL
      console.log('File selected:', file.name);
      // For now, just store the file name
      this.updateProperty(property, file.name);
    }
  }

  getFileName(path: string): string {
    if (!path) return '';
    return path.split('/').pop() || path;
  }

  // Location picker
  openLocationPicker(property: WidgetProperty): void {
    // TODO: Open map picker dialog
    console.log('Open location picker');
  }

  // Rich text methods
  formatText(command: string): void {
    document.execCommand(command, false, undefined);
  }

  onRichTextChange(property: WidgetProperty, event: any): void {
    const html = event.target.innerHTML;
    this.textChangeSubject.next({ property, value: html });
  }
}
