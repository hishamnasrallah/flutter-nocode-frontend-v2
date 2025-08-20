// src/app/core/interceptors/loading.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Global loading state
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private activeRequests = 0;

  setLoading(loading: boolean): void {
    if (loading) {
      this.activeRequests++;
    } else {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
    }

    this.loadingSubject.next(this.activeRequests > 0);
  }

  isLoading(): boolean {
    return this.activeRequests > 0;
  }
}

// Create singleton instance
const loadingService = new LoadingService();

export function getLoadingService(): LoadingService {
  return loadingService;
}

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  // Skip loading indicator for certain requests
  const skipLoading = req.headers.has('Skip-Loading') ||
                     req.url.includes('/health/') ||
                     req.method === 'OPTIONS';

  if (!skipLoading) {
    loadingService.setLoading(true);
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.setLoading(false);
      }
    })
  );
};
