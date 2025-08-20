// src/app/core/services/data-source.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  DataSource,
  DataSourceField,
  DataSourceListResponse,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  AutoDetectFieldsResponse
} from '../models/data-source.model';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  constructor(private api: ApiService) {}

  getDataSources(applicationId: number): Observable<DataSourceListResponse> {
    return this.api.get<DataSourceListResponse>('/api/v1/data-sources/', {
      application: applicationId
    });
  }

  getDataSource(id: number): Observable<DataSource> {
    return this.api.get<DataSource>(`/api/v1/data-sources/${id}/`);
  }

  createDataSource(data: CreateDataSourceRequest): Observable<DataSource> {
    return this.api.post<DataSource>('/api/v1/data-sources/', data);
  }

  updateDataSource(id: number, data: UpdateDataSourceRequest): Observable<DataSource> {
    return this.api.put<DataSource>(`/api/v1/data-sources/${id}/`, data);
  }

  deleteDataSource(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/data-sources/${id}/`);
  }

  testConnection(id: number): Observable<TestConnectionResponse> {
    return this.api.post<TestConnectionResponse>(
      `/api/v1/data-sources/${id}/test_connection/`,
      {}
    );
  }

  autoDetectFields(id: number): Observable<AutoDetectFieldsResponse> {
    return this.api.post<AutoDetectFieldsResponse>(
      `/api/v1/data-sources/${id}/auto_detect_fields/`,
      {}
    );
  }

  // Field management
  getFields(dataSourceId: number): Observable<DataSourceField[]> {
    return this.api.get<DataSourceField[]>('/api/v1/data-source-fields/', {
      data_source: dataSourceId
    });
  }

  createField(field: Partial<DataSourceField>): Observable<DataSourceField> {
    return this.api.post<DataSourceField>('/api/v1/data-source-fields/', field);
  }

  updateField(id: number, field: Partial<DataSourceField>): Observable<DataSourceField> {
    return this.api.put<DataSourceField>(`/api/v1/data-source-fields/${id}/`, field);
  }

  deleteField(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/data-source-fields/${id}/`);
  }

  bulkCreateFields(fields: Partial<DataSourceField>[]): Observable<DataSourceField[]> {
    return this.api.post<DataSourceField[]>('/api/v1/data-source-fields/bulk_create/', {
      fields
    });
  }

  // Helper methods
  formatHeaders(headers: any): string {
    return JSON.stringify(headers, null, 2);
  }

  parseHeaders(headersJson: string): any {
    try {
      return JSON.parse(headersJson);
    } catch {
      return {};
    }
  }

  getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      'GET': '#4CAF50',
      'POST': '#2196F3',
      'PUT': '#FF9800',
      'DELETE': '#F44336',
      'PATCH': '#9C27B0'
    };
    return colors[method] || '#757575';
  }

  // Sample endpoints for common APIs
  getSampleEndpoints(): any[] {
    return [
      {
        name: 'JSONPlaceholder Posts',
        base_url: 'https://jsonplaceholder.typicode.com',
        endpoint: '/posts',
        method: 'GET'
      },
      {
        name: 'OpenWeatherMap',
        base_url: 'https://api.openweathermap.org/data/2.5',
        endpoint: '/weather?q=London&appid=YOUR_API_KEY',
        method: 'GET'
      },
      {
        name: 'REST Countries',
        base_url: 'https://restcountries.com/v3.1',
        endpoint: '/all',
        method: 'GET'
      }
    ];
  }
}
