// src/app/core/services/notification.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  private activeNotifications = new Map<string, any>();

  constructor() {}

  success(message: string, title?: string, duration: number = 3000): string {
    return this.show({
      type: 'success',
      message,
      title,
      duration
    });
  }

  error(message: string, title?: string, duration: number = 5000): string {
    return this.show({
      type: 'error',
      message,
      title,
      duration
    });
  }

  warning(message: string, title?: string, duration: number = 4000): string {
    return this.show({
      type: 'warning',
      message,
      title,
      duration
    });
  }

  info(message: string, title?: string, duration: number = 3000): string {
    return this.show({
      type: 'info',
      message,
      title,
      duration
    });
  }

  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id
    };

    this.notificationSubject.next(fullNotification);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      const timeout = setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);

      this.activeNotifications.set(id, timeout);
    }

    return id;
  }

  dismiss(id: string): void {
    const timeout = this.activeNotifications.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.activeNotifications.delete(id);
    }
  }

  dismissAll(): void {
    this.activeNotifications.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.activeNotifications.clear();
  }

  // Helper method for API errors
  showApiError(error: any): void {
    let message = 'An error occurred';

    if (error.message) {
      message = error.message;
    } else if (error.error?.detail) {
      message = error.error.detail;
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (typeof error.error === 'string') {
      message = error.error;
    }

    this.error(message);
  }

  // Helper method for form validation errors
  showValidationErrors(errors: Record<string, string[]>): void {
    const messages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    this.error(messages, 'Validation Error');
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
