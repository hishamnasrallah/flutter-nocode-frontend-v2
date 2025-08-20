// src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  private getHeaders(skipAuth: boolean = false): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (!skipAuth) {
      const token = this.config.getAccessToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);

    let errorMessage = 'An error occurred';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }

  get<T>(endpoint: string, params?: any, skipAuth: boolean = false): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(url, {
      headers: this.getHeaders(skipAuth),
      params: httpParams
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  post<T>(endpoint: string, data: any, skipAuth: boolean = false): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.post<T>(url, data, {
      headers: this.getHeaders(skipAuth)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  put<T>(endpoint: string, data: any, skipAuth: boolean = false): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.put<T>(url, data, {
      headers: this.getHeaders(skipAuth)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  patch<T>(endpoint: string, data: any, skipAuth: boolean = false): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.patch<T>(url, data, {
      headers: this.getHeaders(skipAuth)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  delete<T>(endpoint: string, skipAuth: boolean = false): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.delete<T>(url, {
      headers: this.getHeaders(skipAuth)
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // For file uploads
  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    const url = this.config.getApiUrl(endpoint);
    const token = this.config.getAccessToken();

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Don't set Content-Type for FormData

    return this.http.post<T>(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // For file downloads
  downloadFile(endpoint: string): Observable<Blob> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // For getting text responses (like preview code)
  getText(endpoint: string): Observable<string> {
    const url = this.config.getApiUrl(endpoint);
    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }
}
