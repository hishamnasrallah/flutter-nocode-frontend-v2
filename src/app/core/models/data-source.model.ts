// src/app/core/models/data-source.model.ts

export interface DataSource {
  id: number;
  application: number;
  name: string;
  data_source_type: 'REST_API' | 'GRAPHQL' | 'FIREBASE' | 'SUPABASE' | 'CUSTOM';
  base_url: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: string;  // JSON string
  use_dynamic_base_url: boolean;
  fields?: DataSourceField[];
  created_at: string;
  updated_at: string;
}

export interface DataSourceField {
  id: number;
  data_source: number;
  field_name: string;
  field_type: FieldType;
  display_name: string;
  is_required: boolean;
  default_value?: string;
  validation_rules?: string;  // JSON string
  created_at: string;
}

export type FieldType =
  | 'string' | 'integer' | 'decimal' | 'boolean'
  | 'date' | 'datetime' | 'url' | 'image_url' | 'email'
  | 'phone' | 'array' | 'object' | 'file' | 'json';

export interface CreateDataSourceRequest {
  application: number;
  name: string;
  data_source_type: string;
  base_url: string;
  endpoint: string;
  method: string;
  headers?: string;
  use_dynamic_base_url?: boolean;
}

export interface UpdateDataSourceRequest {
  name?: string;
  data_source_type?: string;
  base_url?: string;
  endpoint?: string;
  method?: string;
  headers?: string;
  use_dynamic_base_url?: boolean;
}

export interface DataSourceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DataSource[];
}

export interface CreateDataSourceFieldRequest {
  data_source: number;
  field_name: string;
  field_type: FieldType;
  display_name: string;
  is_required: boolean;
  default_value?: string;
  validation_rules?: string;
}

export interface UpdateDataSourceFieldRequest {
  field_name?: string;
  field_type?: FieldType;
  display_name?: string;
  is_required?: boolean;
  default_value?: string;
  validation_rules?: string;
}

export interface TestConnectionRequest {
  base_url: string;
  endpoint: string;
  method: string;
  headers?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  status_code?: number;
  response_data?: any;
  error_message?: string;
}

export interface AutoDetectFieldsResponse {
  fields: DataSourceField[];
  sample_data?: any;
}
