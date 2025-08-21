// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { getLoadingService } from './core/interceptors/loading.interceptor';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';
import {ApiService} from './core/services/api.service';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from './core/services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Flutter No-Code Builder';
  loading$ = getLoadingService().loading$;
  notifications: any[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService

  ) {}

  ngOnInit(): void {
  // Try to restore user session on app initialization
  const token = localStorage.getItem('access_token');
  if (token && !this.authService.currentUserValue) {
    this.authService.checkAuthStatus().subscribe();
  }

  // Subscribe to notifications
  this.notificationService.notification$.subscribe(notification => {
    this.notifications.push(notification);

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  });
}

private checkAuthenticationStatus(): void {
  // This will attempt to restore the user session if a token exists
  const authService = new AuthService(new ApiService(new HttpClient(null as any), new ConfigService(new HttpClient(null as any))), new ConfigService(new HttpClient(null as any)), null as any);
  // Note: This is just for illustration. You should properly inject AuthService
}

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationService.dismiss(id);
  }

  getNotificationClass(type: string): string {
    const classes = {
      'success': 'notification-success',
      'error': 'notification-error',
      'warning': 'notification-warning',
      'info': 'notification-info'
    };
    return classes[type as keyof typeof classes] || 'notification-info';
  }

  getNotificationIcon(type: string): string {
    const icons = {
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info'
    };
    return icons[type as keyof typeof icons] || 'info';
  }
}
