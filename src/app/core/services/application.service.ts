// src/app/core/services/application.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Application,
  ApplicationListResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private currentApplicationSubject = new BehaviorSubject<Application | null>(null);
  public currentApplication$ = this.currentApplicationSubject.asObservable();

  constructor(private api: ApiService) {}

  get currentApplication(): Application | null {
    return this.currentApplicationSubject.value;
  }

  setCurrentApplication(app: Application | null): void {
    this.currentApplicationSubject.next(app);
    if (app) {
      localStorage.setItem('current_app_id', app.id.toString());
    } else {
      localStorage.removeItem('current_app_id');
    }
  }

  getApplications(page: number = 1, pageSize: number = 20): Observable<ApplicationListResponse> {
    return this.api.get<ApplicationListResponse>('/api/v1/applications/', {
      page,
      page_size: pageSize
    });
  }

  getApplication(id: number): Observable<Application> {
    return this.api.get<Application>(`/api/v1/applications/${id}/`).pipe(
      tap(app => this.setCurrentApplication(app))
    );
  }

  createApplication(data: CreateApplicationRequest): Observable<Application> {
    return this.api.post<Application>('/api/v1/applications/', data);
  }

  updateApplication(id: number, data: UpdateApplicationRequest): Observable<Application> {
    return this.api.put<Application>(`/api/v1/applications/${id}/`, data).pipe(
      tap(app => {
        if (this.currentApplication?.id === id) {
          this.setCurrentApplication(app);
        }
      })
    );
  }

  deleteApplication(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/applications/${id}/`).pipe(
      tap(() => {
        if (this.currentApplication?.id === id) {
          this.setCurrentApplication(null);
        }
      })
    );
  }

  buildApplication(id: number): Observable<any> {
    return this.api.post(`/api/v1/applications/${id}/build/`, {});
  }

  cloneApplication(id: number): Observable<Application> {
    return this.api.post<Application>(`/api/v1/applications/${id}/clone/`, {});
  }

  getPreviewCode(id: number): Observable<string> {
    return this.api.getText(`/api/v1/applications/${id}/preview_code/`);
  }

  getStatistics(id: number): Observable<any> {
    return this.api.get(`/api/v1/applications/${id}/statistics/`);
  }

  createFromTemplate(templateId: string): Observable<Application> {
    return this.api.post<Application>('/api/v1/applications/create_from_template/', {
      template_id: templateId
    });
  }

  searchApplications(query: string): Observable<ApplicationListResponse> {
    return this.api.get<ApplicationListResponse>('/api/v1/applications/', {
      search: query
    });
  }

  getRecentApplications(limit: number = 5): Observable<ApplicationListResponse> {
    return this.api.get<ApplicationListResponse>('/api/v1/applications/', {
      page_size: limit,
      ordering: '-updated_at'
    });
  }
}
