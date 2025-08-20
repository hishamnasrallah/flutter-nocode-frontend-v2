// src/app/features/dashboard/project-card/project-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application } from '../../../core/models/application.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent {
  @Input() application!: Application;
  @Input() viewMode: 'grid' | 'list' = 'grid';

  @Output() open = new EventEmitter<Application>();
  @Output() clone = new EventEmitter<Application>();
  @Output() delete = new EventEmitter<Application>();

  showMenu = false;

  onOpen(): void {
    this.open.emit(this.application);
  }

  onClone(): void {
    this.showMenu = false;
    this.clone.emit(this.application);
  }

  onDelete(): void {
    this.showMenu = false;
    this.delete.emit(this.application);
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  getBuildStatusClass(): string {
    switch (this.application.build_status) {
      case 'success':
        return 'status-success';
      case 'building':
        return 'status-building';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-not-built';
    }
  }

  getBuildStatusIcon(): string {
    switch (this.application.build_status) {
      case 'success':
        return 'check_circle';
      case 'building':
        return 'sync';
      case 'failed':
        return 'error';
      default:
        return 'build_circle';
    }
  }

  getBuildStatusText(): string {
    switch (this.application.build_status) {
      case 'success':
        return 'Built';
      case 'building':
        return 'Building...';
      case 'failed':
        return 'Failed';
      default:
        return 'Not Built';
    }
  }

  getFormattedDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes === 0) {
          return 'Just now';
        }
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return d.toLocaleDateString();
    }
  }

  getThumbnailColor(): string {
    // Generate a consistent color based on app name
    const colors = [
      '#667eea', '#764ba2', '#4caf50', '#2196f3',
      '#ff9800', '#f44336', '#e91e63', '#9c27b0',
      '#00bcd4', '#009688', '#795548', '#607d8b'
    ];

    let hash = 0;
    for (let i = 0; i < this.application.name.length; i++) {
      hash = this.application.name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(): string {
    const words = this.application.name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return this.application.name.substring(0, 2).toUpperCase();
  }
}
