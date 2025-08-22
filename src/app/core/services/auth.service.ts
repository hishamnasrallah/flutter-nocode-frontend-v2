// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {BehaviorSubject, Observable, timer, Subscription, of} from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ConfigService } from './config.service';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  LogoutRequest
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private refreshTokenTimer: Subscription | null = null;
  private TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  constructor(
    private api: ApiService,
    private config: ConfigService,
    private router: Router
  ) {
    this.loadStoredUser();
    this.setupTokenRefresh();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }

  private setupTokenRefresh(): void {
    const token = this.config.getAccessToken();
    if (token) {
      this.startTokenRefreshTimer();
    }
  }

  private startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();

    this.refreshTokenTimer = timer(this.TOKEN_REFRESH_INTERVAL, this.TOKEN_REFRESH_INTERVAL)
      .subscribe(() => {
        this.refreshToken().subscribe({
          error: () => {
            console.error('Token refresh failed');
            this.logout();
          }
        });
      });
  }

  private stopTokenRefreshTimer(): void {
    if (this.refreshTokenTimer) {
      this.refreshTokenTimer.unsubscribe();
      this.refreshTokenTimer = null;
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.config.getAccessToken() && !!this.currentUserValue;
  }
  getToken(): string | null {
    return this.config.getAccessToken();
  }
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/login/', credentials, true).pipe(
      tap(response => {
        this.config.setAccessToken(response.tokens.access);
        this.config.setRefreshToken(response.tokens.refresh);
        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.startTokenRefreshTimer();
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/auth/register/', data, true).pipe(
      tap(response => {
        this.config.setAccessToken(response.tokens.access);
        this.config.setRefreshToken(response.tokens.refresh);
        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.startTokenRefreshTimer();
      })
    );
  }

  logout(): void {
  console.log('[AuthService] logout called');
  const refreshToken = this.config.getRefreshToken();
  console.log('[AuthService] Refresh token exists for logout:', !!refreshToken);

  if (refreshToken) {
    const request: LogoutRequest = { refresh: refreshToken };
    console.log('[AuthService] Sending logout request to backend');
    this.api.post('/api/auth/logout/', request).subscribe({
      complete: () => {
        console.log('[AuthService] Logout request completed');
        this.clearAuthData();
      },
      error: (error) => {
        console.error('[AuthService] Logout request failed:', error);
        this.clearAuthData();
      }
    });
  } else {
    console.log('[AuthService] No refresh token, clearing auth data directly');
    this.clearAuthData();
  }
}

  private clearAuthData(): void {
  console.log('[AuthService] clearAuthData called');
  console.log('[AuthService] Current route:', this.router.url);

  this.config.clearTokens();
  localStorage.removeItem('current_user');
  this.currentUserSubject.next(null);
  this.stopTokenRefreshTimer();

  console.log('[AuthService] Auth data cleared, navigating to /login');
  this.router.navigate(['/login']);
}

  refreshToken(): Observable<RefreshTokenResponse> {
  console.log('[AuthService] refreshToken called');
  const refreshToken = this.config.getRefreshToken();
  console.log('[AuthService] Refresh token exists:', !!refreshToken);

  if (!refreshToken) {
    console.error('[AuthService] No refresh token available');
    throw new Error('No refresh token available');
  }

  const request: RefreshTokenRequest = { refresh: refreshToken };
  console.log('[AuthService] Attempting to refresh token');

  return this.api.post<RefreshTokenResponse>('/api/auth/refresh/', request, true).pipe(
    tap(response => {
      console.log('[AuthService] Token refresh successful');
      this.config.setAccessToken(response.access);
      this.config.setRefreshToken(response.refresh);
    })
  );
}

  getProfile(): Observable<User> {
  console.log('[AuthService] getProfile called');
  return this.api.get<{ user: User }>('/api/auth/me/').pipe(
    map(response => {
      console.log('[AuthService] Profile response received:', response);
      return response.user;
    }),
    tap(user => {
      console.log('[AuthService] Storing user in localStorage and subject');
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    })
  );
}

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.api.put<{ user: User; message: string }>('/api/auth/update-profile/', data).pipe(
      map(response => response.user),
      tap(user => {
        localStorage.setItem('current_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/api/auth/change-password/', data);
  }

  // Auto-login check on app initialization
  checkAuthStatus(): Observable<boolean> {
  console.log('[AuthService] checkAuthStatus called');
  const token = this.config.getAccessToken();
  console.log('[AuthService] Access token exists:', !!token);

  if (!token) {
    console.log('[AuthService] No token in checkAuthStatus, returning false');
    return of(false);
  }

  // If we already have user data, no need to fetch again
  if (this.currentUserValue) {
    console.log('[AuthService] User already loaded in checkAuthStatus, returning true');
    return of(true);
  }

  console.log('[AuthService] Fetching user profile to validate session');
  return this.getProfile().pipe(
    map(() => {
      console.log('[AuthService] Profile fetched successfully');
      return true;
    }),
    catchError((error) => {
      console.error('[AuthService] Failed to load user profile:', error);
      console.log('[AuthService] Error status:', error.status);
      // Only clear auth data if we get a 401 (unauthorized)
      if (error.status === 401) {
        console.log('[AuthService] Got 401, clearing auth data');
        this.clearAuthData();
      }
      return of(false);
    })
  );
}
}
