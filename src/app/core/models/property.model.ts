// src/app/core/models/property.model.ts

export interface WidgetProperty {
  id: number;
  widget: number;
  property_name: string;
  property_type: PropertyType;
  display_name?: string;
  // Value fields - only ONE will be populated based on property_type
  string_value?: string;
  integer_value?: number;
  decimal_value?: number;
  boolean_value?: boolean;
  color_value?: string;  // Hex format
  alignment_value?: AlignmentType;
  url_value?: string;
  json_value?: string;
  action_reference?: number;
  data_source_field_reference?: number;
  screen_reference?: number;
  created_at: string;
}

export type PropertyType =
  | 'string' | 'integer' | 'decimal' | 'boolean' | 'color' | 'icon'
  | 'alignment' | 'action_reference' | 'data_source_field_reference'
  | 'screen_reference' | 'asset_reference' | 'url' | 'json'
  | 'file_upload' | 'date_picker' | 'time_picker' | 'map_location' | 'rich_text';

export type AlignmentType =
  | 'center' | 'left' | 'right' | 'top' | 'bottom'
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'centerLeft' | 'centerRight' | 'topCenter' | 'bottomCenter';

export interface CreatePropertyRequest {
  widget: number;
  property_name: string;
  property_type: PropertyType;
  string_value?: string;
  integer_value?: number;
  decimal_value?: number;
  boolean_value?: boolean;
  color_value?: string;
  alignment_value?: AlignmentType;
  url_value?: string;
  json_value?: string;
  action_reference?: number;
  data_source_field_reference?: number;
  screen_reference?: number;
}

export interface UpdatePropertyRequest {
  string_value?: string;
  integer_value?: number;
  decimal_value?: number;
  boolean_value?: boolean;
  color_value?: string;
  alignment_value?: AlignmentType;
  url_value?: string;
  json_value?: string;
  action_reference?: number;
  data_source_field_reference?: number;
  screen_reference?: number;
}

export interface PropertyListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WidgetProperty[];
}

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  label: string;
  required?: boolean;
  defaultValue?: any;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  suffix?: string;
  placeholder?: string;
  helperText?: string;
  category?: string;
}

export interface PropertyGroup {
  name: string;
  properties: PropertyDefinition[];
  expanded?: boolean;
}
