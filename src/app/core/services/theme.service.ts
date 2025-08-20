// src/app/core/services/theme.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Theme, ThemeListResponse, CreateThemeRequest, UpdateThemeRequest } from '../models/theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme | null>(null);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(private api: ApiService) {}

  getThemes(): Observable<ThemeListResponse> {
    return this.api.get<ThemeListResponse>('/api/v1/themes/');
  }

  getTheme(id: number): Observable<Theme> {
    return this.api.get<Theme>(`/api/v1/themes/${id}/`).pipe(
      tap(theme => this.currentThemeSubject.next(theme))
    );
  }

  createTheme(data: CreateThemeRequest): Observable<Theme> {
    return this.api.post<Theme>('/api/v1/themes/', data);
  }

  updateTheme(id: number, data: UpdateThemeRequest): Observable<Theme> {
    return this.api.put<Theme>(`/api/v1/themes/${id}/`, data).pipe(
      tap(theme => {
        if (this.currentThemeSubject.value?.id === id) {
          this.currentThemeSubject.next(theme);
        }
      })
    );
  }

  deleteTheme(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/themes/${id}/`);
  }

  getThemeTemplates(): Observable<any> {
    return this.api.get('/api/v1/themes/templates/');
  }

  duplicateTheme(id: number): Observable<Theme> {
    return this.api.post<Theme>(`/api/v1/themes/${id}/duplicate/`, {});
  }

  // Apply theme to preview
  applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary_color);
    root.style.setProperty('--accent-color', theme.accent_color);
    root.style.setProperty('--background-color', theme.background_color);
    root.style.setProperty('--text-color', theme.text_color);
    root.style.setProperty('--font-family', theme.font_family);

    if (theme.is_dark_mode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Preset themes
  getPresetThemes(): Partial<Theme>[] {
    return [
      {
        name: 'Material Blue',
        primary_color: '#2196F3',
        accent_color: '#FF4081',
        background_color: '#FFFFFF',
        text_color: '#212121',
        font_family: 'Roboto',
        is_dark_mode: false
      },
      {
        name: 'Material Dark',
        primary_color: '#BB86FC',
        accent_color: '#03DAC6',
        background_color: '#121212',
        text_color: '#FFFFFF',
        font_family: 'Roboto',
        is_dark_mode: true
      },
      {
        name: 'iOS Light',
        primary_color: '#007AFF',
        accent_color: '#FF3B30',
        background_color: '#F2F2F7',
        text_color: '#000000',
        font_family: 'SF Pro Display',
        is_dark_mode: false
      },
      {
        name: 'iOS Dark',
        primary_color: '#0A84FF',
        accent_color: '#FF453A',
        background_color: '#000000',
        text_color: '#FFFFFF',
        font_family: 'SF Pro Display',
        is_dark_mode: true
      }
    ];
  }
}
