// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { Router } from '@angular/router';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const configService = inject(ConfigService);
  const router = inject(Router);

  // Skip interceptor for certain requests
  if (req.headers.has('Skip-Interceptor')) {
    const newReq = req.clone({
      headers: req.headers.delete('Skip-Interceptor')
    });
    return next(newReq);
  }

  // Add auth token if available
  const token = configService.getAccessToken();
  let authReq = req;

  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((response) => {
              isRefreshing = false;
              refreshTokenSubject.next(response.access);

              // Retry the original request with new token
              const newAuthReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.access}`)
              });
              return next(newAuthReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // Wait for refresh to complete
          return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(token => {
              const newAuthReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`)
              });
              return next(newAuthReq);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
