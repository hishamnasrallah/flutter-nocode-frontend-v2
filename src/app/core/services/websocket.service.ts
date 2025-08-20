// src/app/core/services/websocket.service.ts

import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { retry, tap, delayWhen, filter } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();

  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(private config: ConfigService) {}

  connect(applicationId: number): void {
    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = `${this.config.getWsUrl()}/ws/builder/${applicationId}/`;
    const token = this.config.getAccessToken();

    // Add token to URL as query parameter
    const urlWithAuth = `${wsUrl}?token=${token}`;

    try {
      this.socket = new WebSocket(urlWithAuth);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next(false);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatusSubject.next(false);
        this.attemptReconnect(applicationId);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  private handleMessage(message: any): void {
    console.log('WebSocket message:', message);

    switch (message.type) {
      case 'widget.created':
        this.messagesSubject.next({
          type: 'widget_created',
          data: message.data
        });
        break;

      case 'widget.updated':
        this.messagesSubject.next({
          type: 'widget_updated',
          data: message.data
        });
        break;

      case 'widget.deleted':
        this.messagesSubject.next({
          type: 'widget_deleted',
          data: message.data
        });
        break;

      case 'build.started':
        this.messagesSubject.next({
          type: 'build_started',
          data: message.data
        });
        break;

      case 'build.progress':
        this.messagesSubject.next({
          type: 'build_progress',
          data: message.data
        });
        break;

      case 'build.completed':
        this.messagesSubject.next({
          type: 'build_completed',
          data: message.data
        });
        break;

      case 'build.failed':
        this.messagesSubject.next({
          type: 'build_failed',
          data: message.data
        });
        break;

      case 'user.joined':
        this.messagesSubject.next({
          type: 'user_joined',
          data: message.data
        });
        break;

      case 'user.left':
        this.messagesSubject.next({
          type: 'user_left',
          data: message.data
        });
        break;

      default:
        this.messagesSubject.next(message);
    }
  }

  private attemptReconnect(applicationId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(applicationId);
    }, this.reconnectInterval);
  }

  // Subscribe to specific events
  onWidgetCreated(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'widget_created')
    );
  }

  onWidgetUpdated(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'widget_updated')
    );
  }

  onWidgetDeleted(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'widget_deleted')
    );
  }

  onBuildProgress(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'build_progress' ||
                    msg.type === 'build_started' ||
                    msg.type === 'build_completed' ||
                    msg.type === 'build_failed')
    );
  }
}
