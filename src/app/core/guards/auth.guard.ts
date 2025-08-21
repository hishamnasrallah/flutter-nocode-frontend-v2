// src/app/core/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

canActivate(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> | Promise<boolean> | boolean {
  // First check if we have a token
  const token = this.authService.getToken();

  if (!token) {
    // No token, redirect to login
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/login']);
    return false;
  }

  // Check if we already have user data loaded
  if (this.authService.currentUserValue) {
    return true;
  }

  // Try to restore session (load user data with existing token)
  return this.authService.checkAuthStatus().pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        // Token is invalid or expired
        localStorage.setItem('redirectUrl', state.url);
        this.router.navigate(['/login']);
        return false;
      }
    }),
    catchError(() => {
      // Error checking auth status
      localStorage.setItem('redirectUrl', state.url);
      this.router.navigate(['/login']);
      return of(false);
    })
  );
}
}
