// src/app/features/data-sources/data-source-list/data-source-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DataSourceService } from '../../../core/services/data-source.service';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DataSource } from '../../../core/models/data-source.model';

interface ConnectionStatus {
  [key: number]: 'connected' | 'error' | 'testing' | 'unknown';
}

@Component({
  selector: 'app-data-source-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-source-list.component.html',
  styleUrls: ['./data-source-list.component.scss']
})
export class DataSourceListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dataSources: DataSource[] = [];
  filteredDataSources: DataSource[] = [];
  connectionStatus: ConnectionStatus = {};
  isLoading = true;
  searchQuery = '';
  selectedType: string = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  openMenuId: number | null = null;

  // Import dialog
  showImportDialog = false;
  selectedImportType: 'postman' | 'swagger' | 'curl' | null = null;
  importData = '';

  stats = {
    rest: 0,
    graphql: 0,
    firebase: 0,
    supabase: 0,
    connected: 0
  };

  constructor(
    private dataSourceService: DataSourceService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDataSources();
    this.loadViewPreference();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataSources(): void {
    const currentApp = this.applicationService.currentApplication;
    if (!currentApp) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isLoading = true;
    this.dataSourceService.getDataSources(currentApp.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSources = response.results;
          this.filteredDataSources = [...this.dataSources];
          this.updateStats();
          this.testAllConnections();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load data sources:', error);
          this.notificationService.error('Failed to load data sources');
          this.isLoading = false;
        }
      });
  }

  updateStats(): void {
    this.stats = {
      rest: this.dataSources.filter(d => d.data_source_type === 'REST_API').length,
      graphql: this.dataSources.filter(d => d.data_source_type === 'GRAPHQL').length,
      firebase: this.dataSources.filter(d => d.data_source_type === 'FIREBASE').length,
      supabase: this.dataSources.filter(d => d.data_source_type === 'SUPABASE').length,
      connected: 0
    };
  }

  testAllConnections(): void {
    this.dataSources.forEach(dataSource => {
      this.testConnection(dataSource, true);
    });
  }

  testConnection(dataSource: DataSource, silent = false): void {
    this.connectionStatus[dataSource.id] = 'testing';

    this.dataSourceService.testConnection(dataSource.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.connectionStatus[dataSource.id] = 'connected';
            this.stats.connected++;
            if (!silent) {
              this.notificationService.success(`Connected to ${dataSource.name}`);
            }
          } else {
            this.connectionStatus[dataSource.id] = 'error';
            if (!silent) {
              this.notificationService.error(response.error_message || 'Connection failed');
            }
          }
        },
        error: (error) => {
          this.connectionStatus[dataSource.id] = 'error';
          if (!silent) {
            this.notificationService.error('Failed to test connection');
          }
        }
      });
  }

  filterDataSources(): void {
    let filtered = [...this.dataSources];

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(d => d.data_source_type === this.selectedType);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.base_url.toLowerCase().includes(query) ||
        d.endpoint.toLowerCase().includes(query)
      );
    }

    this.filteredDataSources = filtered;
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.filterDataSources();
  }

  createDataSource(): void {
    this.router.navigate(['/data-sources/new']);
  }

  editDataSource(dataSource: DataSource): void {
    this.router.navigate(['/data-sources', dataSource.id, 'edit']);
  }

  configureFields(dataSource: DataSource): void {
    this.router.navigate(['/data-sources', dataSource.id, 'fields']);
  }

  duplicateDataSource(dataSource: DataSource): void {
    this.closeMenu();

    const duplicate = {
      ...dataSource,
      name: `${dataSource.name} (Copy)`,
      application: this.applicationService.currentApplication!.id
    };

    delete (duplicate as any).id;
    delete (duplicate as any).created_at;
    delete (duplicate as any).updated_at;

    this.dataSourceService.createDataSource(duplicate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newDataSource) => {
          this.notificationService.success('Data source duplicated successfully');
          this.loadDataSources();
        },
        error: (error) => {
          console.error('Failed to duplicate data source:', error);
          this.notificationService.error('Failed to duplicate data source');
        }
      });
  }

  deleteDataSource(dataSource: DataSource): void {
    this.closeMenu();

    if (confirm(`Are you sure you want to delete "${dataSource.name}"?`)) {
      this.dataSourceService.deleteDataSource(dataSource.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success('Data source deleted successfully');
            this.loadDataSources();
          },
          error: (error) => {
            console.error('Failed to delete data source:', error);
            this.notificationService.error('Failed to delete data source');
          }
        });
    }
  }

  exportDataSource(dataSource: DataSource): void {
    this.closeMenu();

    const exportData = {
      ...dataSource,
      fields: dataSource.fields || [],
      exported_at: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataSource.name.toLowerCase().replace(/\s+/g, '-')}-datasource.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.success('Data source exported successfully');
  }

  importDataSource(): void {
    this.showImportDialog = true;
  }

  selectImportType(type: 'postman' | 'swagger' | 'curl'): void {
    this.selectedImportType = type;
    this.importData = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.importData = e.target.result;
      };
      reader.readAsText(file);
    }
  }

  performImport(): void {
    if (!this.importData || !this.selectedImportType) return;

    try {
      let dataSource: any;

      switch (this.selectedImportType) {
        case 'postman':
          dataSource = this.parsePostmanCollection(this.importData);
          break;
        case 'swagger':
          dataSource = this.parseSwaggerSpec(this.importData);
          break;
        case 'curl':
          dataSource = this.parseCurlCommand(this.importData);
          break;
      }

      if (dataSource) {
        dataSource.application = this.applicationService.currentApplication!.id;

        this.dataSourceService.createDataSource(dataSource)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (created) => {
              this.notificationService.success('Data source imported successfully');
              this.closeImportDialog();
              this.loadDataSources();
              this.router.navigate(['/data-sources', created.id, 'edit']);
            },
            error: (error) => {
              console.error('Failed to import data source:', error);
              this.notificationService.error('Failed to import data source');
            }
          });
      }
    } catch (error) {
      console.error('Failed to parse import data:', error);
      this.notificationService.error('Invalid import format');
    }
  }

  private parsePostmanCollection(jsonString: string): any {
    const collection = JSON.parse(jsonString);
    const firstRequest = collection.item?.[0]?.request || collection.request;

    if (!firstRequest) {
      throw new Error('No requests found in Postman collection');
    }

    const url = new URL(firstRequest.url.raw || firstRequest.url);
    const headers: any = {};

    if (firstRequest.header) {
      firstRequest.header.forEach((h: any) => {
        headers[h.key] = h.value;
      });
    }

    return {
      name: collection.info?.name || 'Imported from Postman',
      data_source_type: 'REST_API',
      base_url: `${url.protocol}//${url.host}`,
      endpoint: url.pathname,
      method: firstRequest.method || 'GET',
      headers: JSON.stringify(headers, null, 2),
      use_dynamic_base_url: false
    };
  }

  private parseSwaggerSpec(jsonString: string): any {
    const spec = JSON.parse(jsonString);
    const firstPath = Object.keys(spec.paths || {})[0];
    const firstMethod = firstPath ? Object.keys(spec.paths[firstPath])[0] : null;

    if (!firstPath || !firstMethod) {
      throw new Error('No paths found in OpenAPI specification');
    }

    const servers = spec.servers || [{ url: 'http://localhost' }];
    const baseUrl = servers[0].url;

    return {
      name: spec.info?.title || 'Imported from OpenAPI',
      data_source_type: 'REST_API',
      base_url: baseUrl,
      endpoint: firstPath,
      method: firstMethod.toUpperCase(),
      headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
      use_dynamic_base_url: false
    };
  }

  private parseCurlCommand(curl: string): any {
    // Basic cURL parsing
    const urlMatch = curl.match(/curl\s+['"](https?:\/\/[^'"]+)['"]/i) ||
                     curl.match(/curl\s+(https?:\/\/[^\s]+)/i);

    if (!urlMatch) {
      throw new Error('Invalid cURL command');
    }

    const url = new URL(urlMatch[1]);
    const methodMatch = curl.match(/-X\s+([A-Z]+)/);
    const method = methodMatch ? methodMatch[1] : 'GET';

    const headers: any = {};
    const headerRegex = /-H\s+['"](.*?):['"]\s*['"](.*?)['"]/g;
    let headerMatch;

    while ((headerMatch = headerRegex.exec(curl)) !== null) {
      headers[headerMatch[1].trim()] = headerMatch[2].trim();
    }

    return {
      name: 'Imported from cURL',
      data_source_type: 'REST_API',
      base_url: `${url.protocol}//${url.host}`,
      endpoint: url.pathname + url.search,
      method: method,
      headers: JSON.stringify(headers, null, 2),
      use_dynamic_base_url: false
    };
  }

  closeImportDialog(): void {
    this.showImportDialog = false;
    this.selectedImportType = null;
    this.importData = '';
  }

  toggleMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  getImportLabel(): string {
    switch (this.selectedImportType) {
      case 'postman':
        return 'Select Postman Collection JSON file:';
      case 'swagger':
        return 'Select OpenAPI/Swagger specification file:';
      case 'curl':
        return 'Paste cURL command:';
      default:
        return '';
    }
  }

  getTypeClass(type: string): string {
    return type.toLowerCase().replace('_', '-');
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'REST_API': 'REST API',
      'GRAPHQL': 'GraphQL',
      'FIREBASE': 'Firebase',
      'SUPABASE': 'Supabase',
      'CUSTOM': 'Custom'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'REST_API': 'api',
      'GRAPHQL': 'hub',
      'FIREBASE': 'local_fire_department',
      'SUPABASE': 'storage',
      'CUSTOM': 'settings'
    };
    return icons[type] || 'cloud';
  }

  getMethodColor(method: string): string {
    return this.dataSourceService.getMethodColor(method);
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'connected': 'Connected',
      'error': 'Connection Error',
      'testing': 'Testing...',
      'unknown': 'Not Tested'
    };
    return texts[status] || 'Unknown';
  }

  private loadViewPreference(): void {
    const saved = localStorage.getItem('dataSourceViewMode');
    if (saved === 'list' || saved === 'grid') {
      this.viewMode = saved;
    }
  }

  private saveViewPreference(): void {
    localStorage.setItem('dataSourceViewMode', this.viewMode);
  }
}
