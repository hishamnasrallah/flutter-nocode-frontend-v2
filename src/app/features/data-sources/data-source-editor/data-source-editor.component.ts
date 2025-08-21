// src/app/features/data-sources/data-source-editor/data-source-editor.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DataSourceService } from '../../../core/services/data-source.service';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DataSource,
  DataSourceField,
  TestConnectionResponse,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  FieldType // Added FieldType import
} from '../../../core/models/data-source.model';

interface Header {
  key: string;
  value: string;
}

@Component({
  selector: 'app-data-source-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-source-editor.component.html',
  styleUrls: ['./data-source-editor.component.scss']
})
export class DataSourceEditorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isEditMode = false;
  dataSourceId: number | null = null;

  dataSource: DataSource = {
    id: 0,
    application: 0,
    name: '',
    data_source_type: 'REST_API',
    base_url: '',
    endpoint: '',
    method: 'GET',
    headers: '{}',
    use_dynamic_base_url: false,
    created_at: '',
    updated_at: ''
  };

  // UI State
  urlError = '';
  isDetecting = false;
  isTesting = false;
  showSampleResponse = true;

  // Configuration
  dataSourceTypes = [
    { value: 'REST_API', label: 'REST API', icon: 'api' },
    { value: 'GRAPHQL', label: 'GraphQL', icon: 'hub' },
    { value: 'FIREBASE', label: 'Firebase', icon: 'local_fire_department' },
    { value: 'SUPABASE', label: 'Supabase', icon: 'storage' },
    { value: 'CUSTOM', label: 'Custom', icon: 'settings' }
  ];

  // Authentication
  authType = 'none';
  authConfig: any = {
    bearerToken: '',
    apiKeyLocation: 'header',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    username: '',
    password: ''
  };

  // Headers
  headers: Header[] = [];

  // Request Body
  bodyFormat = 'json';
  requestBody = '';

  // GraphQL
  graphqlQuery = '';
  graphqlVariables = '{}';

  // Firebase
  firebaseConfig = '';

  // Supabase
  supabaseAnonKey = '';

  // Dynamic URL
  dynamicUrlVariable = 'API_BASE_URL';

  // Endpoint Variables
  endpointVariables: string[] = [];

  // Fields
  fields: DataSourceField[] = [];

  // Testing
  testParams: any = {};
  testRequestBody = '';
  testResult: TestConnectionResponse | null = null;
  sampleResponse: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataSourceService: DataSourceService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.dataSourceId = parseInt(id, 10);
      this.loadDataSource();
    } else {
      this.initializeNewDataSource();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataSource(): void {
    if (!this.dataSourceId) return;

    this.dataSourceService.getDataSource(this.dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataSource) => {
          this.dataSource = dataSource;
          this.parseHeaders();
          this.parseEndpointVariables();
          this.loadFields();
          this.extractAuthFromHeaders();
        },
        error: (error) => {
          console.error('Failed to load data source:', error);
          this.notificationService.error('Failed to load data source');
          this.router.navigate(['/data-sources']);
        }
      });
  }

  loadFields(): void {
    if (!this.dataSourceId) return;

    this.dataSourceService.getFields(this.dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fields) => {
          this.fields = fields;
        },
        error: (error) => {
          console.error('Failed to load fields:', error);
        }
      });
  }

  initializeNewDataSource(): void {
    const app = this.applicationService.currentApplication;
    if (!app) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.dataSource.application = app.id;
    this.addHeader(); // Add default Content-Type header
    this.headers[0] = { key: 'Content-Type', value: 'application/json' };
  }

  selectType(type: string): void {
    this.dataSource.data_source_type = type as DataSource['data_source_type'];

    // Set default configurations based on type
    switch (type) {
      case 'GRAPHQL':
        this.dataSource.method = 'POST';
        this.headers = [
          { key: 'Content-Type', value: 'application/json' }
        ];
        break;
      case 'FIREBASE':
      case 'SUPABASE':
        this.dataSource.method = 'GET';
        break;
    }
  }

  toggleDynamicUrl(): void {
    this.dataSource.use_dynamic_base_url = !this.dataSource.use_dynamic_base_url;
  }

  validateUrl(): void {
    if (!this.dataSource.base_url) {
      this.urlError = '';
      return;
    }

    try {
      new URL(this.dataSource.base_url);
      this.urlError = '';
    } catch {
      this.urlError = 'Invalid URL format';
    }
  }

  parseEndpointVariables(): void {
    const regex = /\{([^}]+)\}/g;
    const variables = [];
    let match;

    while ((match = regex.exec(this.dataSource.endpoint)) !== null) {
      variables.push(match[1]);
    }

    this.endpointVariables = variables;
  }

  onAuthTypeChange(): void {
    this.updateAuthHeaders();
  }

  updateAuthHeaders(): void {
    // Remove existing auth headers
    this.headers = this.headers.filter(h =>
      h.key !== 'Authorization' &&
      h.key !== 'X-API-Key' &&
      !h.key.startsWith('X-') // Remove custom API key headers
    );

    switch (this.authType) {
      case 'bearer':
        if (this.authConfig.bearerToken) {
          this.headers.push({
            key: 'Authorization',
            value: `Bearer ${this.authConfig.bearerToken}`
          });
        }
        break;

      case 'api_key':
        if (this.authConfig.apiKeyLocation === 'header') {
          this.headers.push({
            key: this.authConfig.apiKeyName,
            value: this.authConfig.apiKeyValue
          });
        }
        break;

      case 'basic':
        if (this.authConfig.username && this.authConfig.password) {
          const credentials = btoa(`${this.authConfig.username}:${this.authConfig.password}`);
          this.headers.push({
            key: 'Authorization',
            value: `Basic ${credentials}`
          });
        }
        break;
    }
  }

  extractAuthFromHeaders(): void {
    const authHeader = this.headers.find(h => h.key === 'Authorization');
    if (authHeader) {
      if (authHeader.value.startsWith('Bearer ')) {
        this.authType = 'bearer';
        this.authConfig.bearerToken = authHeader.value.substring(7);
      } else if (authHeader.value.startsWith('Basic ')) {
        this.authType = 'basic';
        try {
          const decoded = atob(authHeader.value.substring(6));
          const [username, password] = decoded.split(':');
          this.authConfig.username = username;
          this.authConfig.password = password;
        } catch {}
      }
    }

    const apiKeyHeader = this.headers.find(h =>
      h.key.toLowerCase().includes('api') ||
      h.key.toLowerCase().includes('key')
    );
    if (apiKeyHeader && !authHeader) {
      this.authType = 'api_key';
      this.authConfig.apiKeyName = apiKeyHeader.key;
      this.authConfig.apiKeyValue = apiKeyHeader.value;
    }
  }

  addHeader(): void {
    this.headers.push({ key: '', value: '' });
  }

  removeHeader(index: number): void {
    this.headers.splice(index, 1);
  }

  parseHeaders(): void {
    try {
      const parsed = JSON.parse(this.dataSource.headers || '{}');
      this.headers = Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    } catch {
      this.headers = [];
    }
  }

  buildHeaders(): string {
    const headerObj: any = {};
    this.headers.forEach(h => {
      if (h.key) {
        headerObj[h.key] = h.value;
      }
    });
    return JSON.stringify(headerObj, null, 2);
  }

  addField(): void {
    const field: DataSourceField = {
      id: 0,
      data_source: this.dataSourceId || 0,
      field_name: '',
      field_type: 'string',
      display_name: '',
      is_required: false,
      created_at: ''
    };
    this.fields.push(field);
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
  }

  async autoDetectFields(): Promise<void> {
    if (!this.canTest()) {
      this.notificationService.warning('Please configure the connection first');
      return;
    }

    this.isDetecting = true;

    // First, save the data source if new
    if (!this.isEditMode) {
      await this.saveDataSource();
    }

    if (!this.dataSourceId) {
      this.isDetecting = false;
      return;
    }

    this.dataSourceService.autoDetectFields(this.dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.fields = response.fields;
          this.sampleResponse = response.sample_data;
          this.notificationService.success(`Detected ${response.fields.length} fields`);
          this.isDetecting = false;
        },
        error: (error) => {
          console.error('Failed to auto-detect fields:', error);
          this.notificationService.error('Failed to auto-detect fields');
          this.isDetecting = false;
        }
      });
  }

  async testConnection(): Promise<void> {
    if (!this.canTest()) return;

    // Save first if new
    if (!this.isEditMode) {
      await this.saveDataSource();
    }

    this.executeTest();
  }

  executeTest(): void {
    if (!this.dataSourceId) return;

    this.isTesting = true;
    this.testResult = null;

    // Build test URL with parameters
    let testEndpoint = this.dataSource.endpoint;
    this.endpointVariables.forEach(variable => {
      const value = this.testParams[variable] || `{${variable}}`;
      testEndpoint = testEndpoint.replace(`{${variable}}`, value);
    });

    this.dataSourceService.testConnection(this.dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.testResult = result;
          this.isTesting = false;

          if (result.success) {
            this.sampleResponse = result.response_data;
            this.notificationService.success('Connection test successful');
          } else {
            this.notificationService.error(result.error_message || 'Connection test failed');
          }
        },
        error: (error) => {
          console.error('Connection test failed:', error);
          this.testResult = {
            success: false,
            error_message: error.message || 'Connection test failed'
          };
          this.isTesting = false;
        }
      });
  }

  useResponseForFields(): void {
    if (!this.testResult?.response_data) return;

    this.fields = this.generateFieldsFromResponse(this.testResult.response_data);
    this.notificationService.success('Fields generated from response');
  }

  private generateFieldsFromResponse(data: any): DataSourceField[] {
    const fields: DataSourceField[] = [];
    const processedData = Array.isArray(data) ? data[0] : data;

    if (!processedData || typeof processedData !== 'object') {
      return fields;
    }

    Object.entries(processedData).forEach(([key, value]) => {
      const field: DataSourceField = {
        id: 0,
        data_source: this.dataSourceId || 0,
        field_name: key,
        display_name: this.formatDisplayName(key),
        field_type: this.detectFieldType(value) as FieldType,
        is_required: false,
        created_at: ''
      };
      fields.push(field);
    });

    return fields;
  }

  private formatDisplayName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private detectFieldType(value: any): string {
    if (value === null || value === undefined) return 'string';

    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'decimal';
    }
    if (typeof value === 'string') {
      // Check for specific formats
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'datetime';
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
      if (/^https?:\/\//.test(value)) {
        if (/\.(jpg|jpeg|png|gif|svg|webp)/i.test(value)) return 'image_url';
        return 'url';
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
      if (/^\+?[\d\s()-]+$/.test(value) && value.length > 9) return 'phone';
      return 'string';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';

    return 'string';
  }

  async save(): Promise<void> {
    if (!this.isValid()) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    await this.saveDataSource();
    await this.saveFields();

    this.notificationService.success('Data source saved successfully');
    this.router.navigate(['/data-sources']);
  }

  private async saveDataSource(): Promise<void> {
    // Update headers
    this.updateAuthHeaders();
    this.dataSource.headers = this.buildHeaders();

    const data = this.isEditMode
      ? this.buildUpdateRequest()
      : this.buildCreateRequest();

    const request = this.isEditMode && this.dataSourceId
      ? this.dataSourceService.updateDataSource(this.dataSourceId, data as UpdateDataSourceRequest)
      : this.dataSourceService.createDataSource(data as CreateDataSourceRequest);

    return new Promise((resolve, reject) => {
      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: (saved) => {
          if (!this.isEditMode) {
            this.dataSourceId = saved.id;
            this.isEditMode = true;
          }
          resolve();
        },
        error: (error) => {
          console.error('Failed to save data source:', error);
          this.notificationService.error('Failed to save data source');
          reject(error);
        }
      });
    });
  }

  private async saveFields(): Promise<void> {
    if (!this.dataSourceId || this.fields.length === 0) return;

    const validFields = this.fields.filter(f => f.field_name && f.display_name);

    for (const field of validFields) {
      field.data_source = this.dataSourceId;

      const request = field.id
        ? this.dataSourceService.updateField(field.id, field)
        : this.dataSourceService.createField(field);

      await request.toPromise();
    }
  }

  private buildCreateRequest(): CreateDataSourceRequest {
    return {
      application: this.dataSource.application,
      name: this.dataSource.name,
      data_source_type: this.dataSource.data_source_type,
      base_url: this.dataSource.base_url,
      endpoint: this.dataSource.endpoint,
      method: this.dataSource.method,
      headers: this.dataSource.headers,
      use_dynamic_base_url: this.dataSource.use_dynamic_base_url
    };
  }

  private buildUpdateRequest(): UpdateDataSourceRequest {
    return {
      name: this.dataSource.name,
      data_source_type: this.dataSource.data_source_type,
      base_url: this.dataSource.base_url,
      endpoint: this.dataSource.endpoint,
      method: this.dataSource.method,
      headers: this.dataSource.headers,
      use_dynamic_base_url: this.dataSource.use_dynamic_base_url
    };
  }

  isValid(): boolean {
    return !!(
      this.dataSource.name &&
      this.dataSource.data_source_type &&
      this.dataSource.base_url &&
      this.dataSource.endpoint &&
      !this.urlError
    );
  }

  canTest(): boolean {
    return !!(
      this.dataSource.base_url &&
      this.dataSource.endpoint &&
      !this.urlError
    );
  }

  isJsonValid(json: string): boolean {
    if (!json) return true;
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  goBack(): void {
    this.router.navigate(['/data-sources']);
  }
}
