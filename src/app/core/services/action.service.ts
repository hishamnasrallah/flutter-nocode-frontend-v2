// src/app/core/services/action.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Action, ActionListResponse, CreateActionRequest, UpdateActionRequest, ActionTypeInfo } from '../models/action.model';

@Injectable({ providedIn: 'root' })
export class ActionService {
  constructor(private api: ApiService) {}

  getActions(applicationId: number): Observable<ActionListResponse> {
    return this.api.get<ActionListResponse>('/api/v1/actions/', {
      application: applicationId
    });
  }

  getAction(id: number): Observable<Action> {
    return this.api.get<Action>(`/api/v1/actions/${id}/`);
  }

  createAction(data: CreateActionRequest): Observable<Action> {
    return this.api.post<Action>('/api/v1/actions/', data);
  }

  updateAction(id: number, data: UpdateActionRequest): Observable<Action> {
    return this.api.put<Action>(`/api/v1/actions/${id}/`, data);
  }

  deleteAction(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/actions/${id}/`);
  }

  getActionTypes(): Observable<any> {
    return this.api.get('/api/v1/actions/action_types/');
  }

  // Action type definitions
  getActionTypeInfo(): ActionTypeInfo[] {
    return [
      {
        type: 'navigate',
        label: 'Navigate to Screen',
        icon: 'navigation',
        category: 'Navigation',
        requiredFields: ['target_screen'],
        optionalFields: [],
        description: 'Navigate to another screen in the app'
      },
      {
        type: 'navigate_back',
        label: 'Go Back',
        icon: 'arrow_back',
        category: 'Navigation',
        requiredFields: [],
        optionalFields: [],
        description: 'Navigate to the previous screen'
      },
      {
        type: 'api_call',
        label: 'API Call',
        icon: 'cloud',
        category: 'Data',
        requiredFields: ['api_data_source'],
        optionalFields: ['parameters'],
        description: 'Make an API request'
      },
      {
        type: 'show_dialog',
        label: 'Show Dialog',
        icon: 'message',
        category: 'UI',
        requiredFields: ['dialog_title', 'dialog_message'],
        optionalFields: [],
        description: 'Display a dialog message'
      },
      {
        type: 'show_snackbar',
        label: 'Show Snackbar',
        icon: 'info',
        category: 'UI',
        requiredFields: ['dialog_message'],
        optionalFields: [],
        description: 'Display a snackbar notification'
      },
      {
        type: 'open_url',
        label: 'Open URL',
        icon: 'open_in_new',
        category: 'External',
        requiredFields: ['url'],
        optionalFields: [],
        description: 'Open a URL in browser'
      },
      {
        type: 'share_content',
        label: 'Share',
        icon: 'share',
        category: 'External',
        requiredFields: ['parameters'],
        optionalFields: [],
        description: 'Share content via system share sheet'
      },
      {
        type: 'toggle_visibility',
        label: 'Toggle Visibility',
        icon: 'visibility',
        category: 'UI',
        requiredFields: ['parameters'],
        optionalFields: [],
        description: 'Show or hide a widget'
      }
    ];
  }

  // Validate action configuration
  validateAction(action: Partial<Action>): string[] {
    const errors: string[] = [];
    const typeInfo = this.getActionTypeInfo().find(t => t.type === action.action_type);

    if (!typeInfo) {
      errors.push('Invalid action type');
      return errors;
    }

    // Check required fields
    typeInfo.requiredFields.forEach(field => {
      if (!action[field as keyof Action]) {
        errors.push(`${field} is required`);
      }
    });

    // Validate URL format
    if (action.action_type === 'open_url' && action.url) {
      try {
        new URL(action.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    return errors;
  }
}
