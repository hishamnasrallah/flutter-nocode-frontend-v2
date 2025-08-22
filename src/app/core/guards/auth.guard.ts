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
  console.log('[AuthGuard] canActivate called for route:', state.url);

  // First check if we have a token
  const token = this.authService.getToken();
  console.log('[AuthGuard] Token exists:', !!token);

  if (!token) {
    // No token, redirect to login
    console.log('[AuthGuard] No token found, redirecting to login');
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/login']);
    return false;
  }

  // Check if we already have user data loaded
  const currentUser = this.authService.currentUserValue;
  console.log('[AuthGuard] Current user exists:', !!currentUser);

  if (currentUser) {
    console.log('[AuthGuard] User already loaded, allowing access');
    return true;
  }

  // Try to restore session (load user data with existing token)
  console.log('[AuthGuard] No user data, attempting to restore session via checkAuthStatus');
  return this.authService.checkAuthStatus().pipe(
    take(1),
    map(isAuthenticated => {
      console.log('[AuthGuard] checkAuthStatus result:', isAuthenticated);
      if (isAuthenticated) {
        console.log('[AuthGuard] Session restored successfully, allowing access');
        return true;
      } else {
        // Token is invalid or expired
        console.log('[AuthGuard] Session restoration failed, redirecting to login');
        localStorage.setItem('redirectUrl', state.url);
        this.router.navigate(['/login']);
        return false;
      }
    }),
    catchError((error) => {
      // Error checking auth status
      console.error('[AuthGuard] Error in checkAuthStatus:', error);
      localStorage.setItem('redirectUrl', state.url);
      this.router.navigate(['/login']);
      return of(false);
    })
  );
}
}
