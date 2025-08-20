// src/app/core/services/property.service.ts

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  WidgetProperty,
  PropertyType,
  PropertyListResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyDefinition,
  PropertyGroup
} from '../models/property.model';
import { WidgetType } from '../models/widget.model';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private propertyChangedSubject = new Subject<WidgetProperty>();
  public propertyChanged$ = this.propertyChangedSubject.asObservable();

  private propertyUpdateQueue = new Subject<{ id: number; data: UpdatePropertyRequest }>();

  constructor(private api: ApiService) {
    // Batch property updates to reduce API calls
    this.propertyUpdateQueue.pipe(
      debounceTime(300)
    ).subscribe(update => {
      this.updateProperty(update.id, update.data).subscribe();
    });
  }

  getProperties(widgetId: number): Observable<PropertyListResponse> {
    return this.api.get<PropertyListResponse>('/api/v1/widget-properties/', {
      widget: widgetId
    });
  }

  createProperty(data: CreatePropertyRequest): Observable<WidgetProperty> {
    return this.api.post<WidgetProperty>('/api/v1/widget-properties/', data).pipe(
      tap(property => this.propertyChangedSubject.next(property))
    );
  }

  updateProperty(id: number, data: UpdatePropertyRequest): Observable<WidgetProperty> {
    return this.api.put<WidgetProperty>(`/api/v1/widget-properties/${id}/`, data).pipe(
      tap(property => this.propertyChangedSubject.next(property))
    );
  }

  deleteProperty(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/widget-properties/${id}/`);
  }

  bulkUpdateProperties(properties: Array<{ id: number; data: UpdatePropertyRequest }>): Observable<any> {
    return this.api.post('/api/v1/widget-properties/bulk_update/', { properties });
  }

  // Queue property update for debouncing
  queuePropertyUpdate(id: number, data: UpdatePropertyRequest): void {
    this.propertyUpdateQueue.next({ id, data });
  }

  // Get property value based on type
  getPropertyValue(property: WidgetProperty): any {
    switch (property.property_type) {
      case 'string':
        return property.string_value;
      case 'integer':
        return property.integer_value;
      case 'decimal':
        return property.decimal_value;
      case 'boolean':
        return property.boolean_value;
      case 'color':
        return property.color_value;
      case 'alignment':
        return property.alignment_value;
      case 'url':
        return property.url_value;
      case 'json':
        return property.json_value ? JSON.parse(property.json_value) : null;
      case 'action_reference':
        return property.action_reference;
      case 'data_source_field_reference':
        return property.data_source_field_reference;
      case 'screen_reference':
        return property.screen_reference;
      default:
        return null;
    }
  }

  // Create update request based on property type
  createUpdateRequest(propertyType: PropertyType, value: any): UpdatePropertyRequest {
    const request: UpdatePropertyRequest = {};

    switch (propertyType) {
      case 'string':
        request.string_value = value;
        break;
      case 'integer':
        request.integer_value = parseInt(value, 10);
        break;
      case 'decimal':
        request.decimal_value = parseFloat(value);
        break;
      case 'boolean':
        request.boolean_value = !!value;
        break;
      case 'color':
        request.color_value = value;
        break;
      case 'alignment':
        request.alignment_value = value;
        break;
      case 'url':
        request.url_value = value;
        break;
      case 'json':
        request.json_value = typeof value === 'string' ? value : JSON.stringify(value);
        break;
      case 'action_reference':
        request.action_reference = value;
        break;
      case 'data_source_field_reference':
        request.data_source_field_reference = value;
        break;
      case 'screen_reference':
        request.screen_reference = value;
        break;
    }

    return request;
  }

  // Get property definitions for widget type
  getPropertyDefinitions(widgetType: WidgetType): PropertyGroup[] {
    const definitions = this.widgetPropertyDefinitions[widgetType] || [];
    return definitions;
  }

  // Widget property definitions
  private widgetPropertyDefinitions: Record<string, PropertyGroup[]> = {
    'Text': [
      {
        name: 'Content',
        properties: [
          { name: 'text', type: 'string', label: 'Text Content', required: true },
          { name: 'overflow', type: 'string', label: 'Overflow', options: [
            { value: 'clip', label: 'Clip' },
            { value: 'fade', label: 'Fade' },
            { value: 'ellipsis', label: 'Ellipsis' },
            { value: 'visible', label: 'Visible' }
          ]}
        ]
      },
      {
        name: 'Style',
        properties: [
          { name: 'fontSize', type: 'decimal', label: 'Font Size', min: 8, max: 72, defaultValue: 14 },
          { name: 'fontWeight', type: 'string', label: 'Font Weight', options: [
            { value: 'normal', label: 'Normal' },
            { value: 'bold', label: 'Bold' },
            { value: 'w100', label: 'Thin (100)' },
            { value: 'w200', label: 'Extra Light (200)' },
            { value: 'w300', label: 'Light (300)' },
            { value: 'w400', label: 'Regular (400)' },
            { value: 'w500', label: 'Medium (500)' },
            { value: 'w600', label: 'Semi Bold (600)' },
            { value: 'w700', label: 'Bold (700)' },
            { value: 'w800', label: 'Extra Bold (800)' },
            { value: 'w900', label: 'Black (900)' }
          ]},
          { name: 'color', type: 'color', label: 'Text Color', defaultValue: '#000000' },
          { name: 'textAlign', type: 'alignment', label: 'Text Alignment' },
          { name: 'fontStyle', type: 'string', label: 'Font Style', options: [
            { value: 'normal', label: 'Normal' },
            { value: 'italic', label: 'Italic' }
          ]}
        ]
      }
    ],
    'Container': [
      {
        name: 'Layout',
        properties: [
          { name: 'width', type: 'decimal', label: 'Width', suffix: 'px' },
          { name: 'height', type: 'decimal', label: 'Height', suffix: 'px' },
          { name: 'padding', type: 'decimal', label: 'Padding', suffix: 'px', defaultValue: 0 },
          { name: 'margin', type: 'decimal', label: 'Margin', suffix: 'px', defaultValue: 0 },
          { name: 'alignment', type: 'alignment', label: 'Child Alignment' }
        ]
      },
      {
        name: 'Decoration',
        properties: [
          { name: 'color', type: 'color', label: 'Background Color' },
          { name: 'borderRadius', type: 'decimal', label: 'Border Radius', suffix: 'px', min: 0, max: 100 },
          { name: 'borderWidth', type: 'decimal', label: 'Border Width', suffix: 'px', min: 0, max: 10 },
          { name: 'borderColor', type: 'color', label: 'Border Color' }
        ]
      },
      {
        name: 'Effects',
        properties: [
          { name: 'elevation', type: 'integer', label: 'Shadow Elevation', min: 0, max: 24 }
        ]
      }
    ],
    'Image': [
      {
        name: 'Source',
        properties: [
          { name: 'imageUrl', type: 'url', label: 'Image URL', required: true },
          { name: 'altText', type: 'string', label: 'Alt Text' }
        ]
      },
      {
        name: 'Size',
        properties: [
          { name: 'width', type: 'decimal', label: 'Width', suffix: 'px' },
          { name: 'height', type: 'decimal', label: 'Height', suffix: 'px' },
          { name: 'fit', type: 'string', label: 'Fit', options: [
            { value: 'cover', label: 'Cover' },
            { value: 'contain', label: 'Contain' },
            { value: 'fill', label: 'Fill' },
            { value: 'fitWidth', label: 'Fit Width' },
            { value: 'fitHeight', label: 'Fit Height' },
            { value: 'none', label: 'None' },
            { value: 'scaleDown', label: 'Scale Down' }
          ]}
        ]
      }
    ],
    'ElevatedButton': [
      {
        name: 'Content',
        properties: [
          { name: 'text', type: 'string', label: 'Button Text', required: true },
          { name: 'onPressed', type: 'action_reference', label: 'On Click Action' }
        ]
      },
      {
        name: 'Style',
        properties: [
          { name: 'backgroundColor', type: 'color', label: 'Background Color', defaultValue: '#2196F3' },
          { name: 'foregroundColor', type: 'color', label: 'Text Color', defaultValue: '#FFFFFF' },
          { name: 'elevation', type: 'integer', label: 'Elevation', min: 0, max: 24, defaultValue: 2 },
          { name: 'padding', type: 'decimal', label: 'Padding', suffix: 'px', defaultValue: 16 }
        ]
      }
    ],
    'TextField': [
      {
        name: 'Content',
        properties: [
          { name: 'hintText', type: 'string', label: 'Hint Text' },
          { name: 'labelText', type: 'string', label: 'Label Text' },
          { name: 'helperText', type: 'string', label: 'Helper Text' },
          { name: 'errorText', type: 'string', label: 'Error Text' }
        ]
      },
      {
        name: 'Input',
        properties: [
          { name: 'keyboardType', type: 'string', label: 'Keyboard Type', options: [
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Number' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'url', label: 'URL' },
            { value: 'multiline', label: 'Multiline' }
          ]},
          { name: 'obscureText', type: 'boolean', label: 'Password Field' },
          { name: 'maxLength', type: 'integer', label: 'Max Length' },
          { name: 'maxLines', type: 'integer', label: 'Max Lines', defaultValue: 1 }
        ]
      },
      {
        name: 'Style',
        properties: [
          { name: 'filled', type: 'boolean', label: 'Filled Background' },
          { name: 'fillColor', type: 'color', label: 'Fill Color' },
          { name: 'borderStyle', type: 'string', label: 'Border Style', options: [
            { value: 'outline', label: 'Outline' },
            { value: 'underline', label: 'Underline' },
            { value: 'none', label: 'None' }
          ]}
        ]
      }
    ],
    'Column': [
      {
        name: 'Layout',
        properties: [
          { name: 'mainAxisAlignment', type: 'string', label: 'Main Axis Alignment', options: [
            { value: 'start', label: 'Start' },
            { value: 'end', label: 'End' },
            { value: 'center', label: 'Center' },
            { value: 'spaceBetween', label: 'Space Between' },
            { value: 'spaceAround', label: 'Space Around' },
            { value: 'spaceEvenly', label: 'Space Evenly' }
          ]},
          { name: 'crossAxisAlignment', type: 'string', label: 'Cross Axis Alignment', options: [
            { value: 'start', label: 'Start' },
            { value: 'end', label: 'End' },
            { value: 'center', label: 'Center' },
            { value: 'stretch', label: 'Stretch' }
          ]},
          { name: 'mainAxisSize', type: 'string', label: 'Main Axis Size', options: [
            { value: 'min', label: 'Min' },
            { value: 'max', label: 'Max' }
          ]}
        ]
      }
    ],
    'Row': [
      {
        name: 'Layout',
        properties: [
          { name: 'mainAxisAlignment', type: 'string', label: 'Main Axis Alignment', options: [
            { value: 'start', label: 'Start' },
            { value: 'end', label: 'End' },
            { value: 'center', label: 'Center' },
            { value: 'spaceBetween', label: 'Space Between' },
            { value: 'spaceAround', label: 'Space Around' },
            { value: 'spaceEvenly', label: 'Space Evenly' }
          ]},
          { name: 'crossAxisAlignment', type: 'string', label: 'Cross Axis Alignment', options: [
            { value: 'start', label: 'Start' },
            { value: 'end', label: 'End' },
            { value: 'center', label: 'Center' },
            { value: 'stretch', label: 'Stretch' }
          ]},
          { name: 'mainAxisSize', type: 'string', label: 'Main Axis Size', options: [
            { value: 'min', label: 'Min' },
            { value: 'max', label: 'Max' }
          ]}
        ]
      }
    ],
    'Icon': [
      {
        name: 'Content',
        properties: [
          { name: 'icon', type: 'icon', label: 'Icon', required: true },
          { name: 'size', type: 'decimal', label: 'Size', min: 12, max: 96, defaultValue: 24 },
          { name: 'color', type: 'color', label: 'Color' }
        ]
      }
    ],
    'Padding': [
      {
        name: 'Spacing',
        properties: [
          { name: 'padding', type: 'decimal', label: 'All Sides', suffix: 'px', defaultValue: 8 },
          { name: 'paddingTop', type: 'decimal', label: 'Top', suffix: 'px' },
          { name: 'paddingRight', type: 'decimal', label: 'Right', suffix: 'px' },
          { name: 'paddingBottom', type: 'decimal', label: 'Bottom', suffix: 'px' },
          { name: 'paddingLeft', type: 'decimal', label: 'Left', suffix: 'px' }
        ]
      }
    ]
  };
}
