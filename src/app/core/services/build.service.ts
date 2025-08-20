// src/app/core/services/build.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BuildHistory, BuildListResponse, StartBuildRequest, BuildOptions } from '../models/build.model';

@Injectable({ providedIn: 'root' })
export class BuildService {
  constructor(private api: ApiService) {}

  getBuildHistory(applicationId: number): Observable<BuildListResponse> {
    return this.api.get<BuildListResponse>('/api/v1/build-history/', {
      application: applicationId
    });
  }

  getBuildDetails(buildId: number): Observable<BuildHistory> {
    return this.api.get<BuildHistory>(`/api/v1/build-history/${buildId}/`);
  }

  getBuildLogs(buildId: number): Observable<string> {
    return this.api.getText(`/api/v1/build-history/${buildId}/logs/`);
  }

  downloadApk(buildId: number): Observable<Blob> {
    return this.api.downloadFile(`/api/v1/build-history/${buildId}/download_apk/`);
  }

  downloadSourceCode(buildId: number): Observable<Blob> {
    return this.api.downloadFile(`/api/v1/build-history/${buildId}/download_source/`);
  }

  startBuild(applicationId: number, options: BuildOptions): Observable<BuildHistory> {
    const request: StartBuildRequest = {
      application_id: applicationId,
      build_type: options.buildType,
      platform: options.platform,
      clean_build: options.cleanBuild
    };

    return this.api.post<BuildHistory>(`/api/v1/applications/${applicationId}/build/`, request);
  }

  cancelBuild(buildId: number): Observable<void> {
    return this.api.post<void>(`/api/v1/build-history/${buildId}/cancel/`, {});
  }

  // Utility methods
  getBuildStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'started': 'hourglass_empty',
      'generating_code': 'code',
      'building_apk': 'build',
      'success': 'check_circle',
      'failed': 'error',
      'cancelled': 'cancel'
    };
    return icons[status] || 'help_outline';
  }

  getBuildStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'started': '#2196F3',
      'generating_code': '#03A9F4',
      'building_apk': '#00BCD4',
      'success': '#4CAF50',
      'failed': '#F44336',
      'cancelled': '#9E9E9E'
    };
    return colors[status] || '#757575';
  }

  formatBuildDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
