// src/app/core/services/screen.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Screen,
  ScreenListResponse,
  CreateScreenRequest,
  UpdateScreenRequest
} from '../models/screen.model';

@Injectable({ providedIn: 'root' })
export class ScreenService {
  private currentScreenSubject = new BehaviorSubject<Screen | null>(null);
  public currentScreen$ = this.currentScreenSubject.asObservable();

  private screensSubject = new BehaviorSubject<Screen[]>([]);
  public screens$ = this.screensSubject.asObservable();

  constructor(private api: ApiService) {}

  get currentScreen(): Screen | null {
    return this.currentScreenSubject.value;
  }

  get screens(): Screen[] {
    return this.screensSubject.value;
  }

  setCurrentScreen(screen: Screen | null): void {
    this.currentScreenSubject.next(screen);
    if (screen) {
      localStorage.setItem('current_screen_id', screen.id.toString());
    } else {
      localStorage.removeItem('current_screen_id');
    }
  }

  getScreens(applicationId: number): Observable<ScreenListResponse> {
    return this.api.get<ScreenListResponse>('/api/v1/screens/', {
      application: applicationId
    }).pipe(
      tap(response => {
        this.screensSubject.next(response.results);

        // Set first screen as current if none selected
        if (!this.currentScreen && response.results.length > 0) {
          const homeScreen = response.results.find(s => s.is_home_screen);
          this.setCurrentScreen(homeScreen || response.results[0]);
        }
      })
    );
  }

  getScreen(id: number): Observable<Screen> {
    return this.api.get<Screen>(`/api/v1/screens/${id}/`).pipe(
      tap(screen => this.setCurrentScreen(screen))
    );
  }

  createScreen(data: CreateScreenRequest): Observable<Screen> {
    return this.api.post<Screen>('/api/v1/screens/', data).pipe(
      tap(screen => {
        const screens = [...this.screens, screen];
        this.screensSubject.next(screens);
        this.setCurrentScreen(screen);
      })
    );
  }

  updateScreen(id: number, data: UpdateScreenRequest): Observable<Screen> {
    return this.api.put<Screen>(`/api/v1/screens/${id}/`, data).pipe(
      tap(screen => {
        const screens = this.screens.map(s => s.id === id ? screen : s);
        this.screensSubject.next(screens);

        if (this.currentScreen?.id === id) {
          this.setCurrentScreen(screen);
        }
      })
    );
  }

  deleteScreen(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/screens/${id}/`).pipe(
      tap(() => {
        const screens = this.screens.filter(s => s.id !== id);
        this.screensSubject.next(screens);

        if (this.currentScreen?.id === id) {
          // Switch to another screen
          const nextScreen = screens.find(s => s.is_home_screen) || screens[0];
          this.setCurrentScreen(nextScreen || null);
        }
      })
    );
  }

  duplicateScreen(id: number): Observable<Screen> {
    return this.api.post<Screen>(`/api/v1/screens/${id}/duplicate/`, {}).pipe(
      tap(screen => {
        const screens = [...this.screens, screen];
        this.screensSubject.next(screens);
      })
    );
  }

  setHomeScreen(id: number): Observable<Screen> {
    return this.api.post<Screen>(`/api/v1/screens/${id}/set_home/`, {}).pipe(
      tap(screen => {
        // Update all screens to reflect new home screen
        const screens = this.screens.map(s => ({
          ...s,
          is_home_screen: s.id === id
        }));
        this.screensSubject.next(screens);
      })
    );
  }

  getWidgetTree(id: number): Observable<any> {
    return this.api.get(`/api/v1/screens/${id}/widget_tree/`);
  }

  // Helper methods
  getHomeScreen(): Screen | null {
    return this.screens.find(s => s.is_home_screen) || null;
  }

  getScreenByRoute(route: string): Screen | null {
    return this.screens.find(s => s.route_name === route) || null;
  }

  generateUniqueRouteName(baseName: string): string {
    let route = `/${baseName.toLowerCase().replace(/\s+/g, '-')}`;
    let counter = 1;

    while (this.screens.some(s => s.route_name === route)) {
      route = `/${baseName.toLowerCase().replace(/\s+/g, '-')}-${counter}`;
      counter++;
    }

    return route;
  }

  reorderScreens(screenIds: number[]): void {
    const orderedScreens = screenIds
      .map(id => this.screens.find(s => s.id === id))
      .filter(s => s !== undefined) as Screen[];

    this.screensSubject.next(orderedScreens);
  }
}
