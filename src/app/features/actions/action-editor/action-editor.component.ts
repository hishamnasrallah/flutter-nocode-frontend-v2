// src/app/features/actions/action-editor/action-editor.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Action, ActionType, ActionTypeInfo } from '../../../core/models/action.model';
import { Application } from '../../../core/models/application.model';
import { Screen } from '../../../core/models/screen.model';
import { DataSource } from '../../../core/models/data-source.model';
import { ActionService } from '../../../core/services/action.service';

interface ActionCategory {
  name: string;
  icon: string;
  types: ActionTypeInfo[];
}

interface ApiParameter {
  key: string;
  type: 'static' | 'dynamic' | 'widget';
  value: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

interface ShareData {
  title: string;
  text: string;
  url: string;
}

@Component({
  selector: 'app-action-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './action-editor.component.html',
  styleUrls: ['./action-editor.component.scss']
})
export class ActionEditorComponent implements OnInit {
  @Input() action: Action | null = null;
  @Input() application: Application | null = null;
  @Input() screens: Screen[] = [];
  @Input() dataSources: DataSource[] = [];

  @Output() save = new EventEmitter<Partial<Action>>();
  @Output() cancel = new EventEmitter<void>();

  isEditMode = false;
  formData: Partial<Action> = {
    name: '',
    action_type: null as any,
    target_screen: undefined,
    api_data_source: undefined,
    parameters: '',
    dialog_title: '',
    dialog_message: '',
    url: ''
  };

  validationErrors: Record<string, string> = {};

  // Action categories with their types
  actionCategories: ActionCategory[] = [];

  // Dynamic form data
  navigationParams = '';
  apiParameters: ApiParameter[] = [];
  responseHandling = 'none';
  dialogOptions = { showCancel: true, showConfirm: true };
  snackbarDuration = 3;
  snackbarPosition = 'bottom';
  openInNewTab = true;
  emailData: EmailData = { to: '', subject: '', body: '' };
  phoneNumber = '';
  shareData: ShareData = { title: '', text: '', url: '' };
  visibilityWidgetId = '';
  visibilityAction = 'toggle';
  formWidgetId = '';
  formSubmitEndpoint: number | null = null;
  dataStorageKey = '';
  dataSource = 'widget';
  customData = '';

  constructor(private actionService: ActionService) {}

  ngOnInit(): void {
    this.initializeCategories();

    if (this.action) {
      this.isEditMode = true;
      this.loadAction(this.action);
    } else {
      this.initializeNewAction();
    }
  }

  private initializeCategories(): void {
    const allTypes = this.actionService.getActionTypeInfo();

    const categories = [
      { name: 'Navigation', icon: 'navigation', typeNames: ['navigate', 'navigate_back'] },
      { name: 'Data', icon: 'cloud', typeNames: ['api_call', 'save_data', 'load_data', 'refresh_data'] },
      { name: 'UI', icon: 'widgets', typeNames: ['show_dialog', 'show_snackbar', 'toggle_visibility', 'show_toast'] },
      { name: 'External', icon: 'open_in_new', typeNames: ['open_url', 'share_content', 'send_email', 'make_phone_call'] },
      { name: 'Form', icon: 'description', typeNames: ['submit_form', 'validate_form', 'clear_form'] },
      { name: 'Media', icon: 'photo_camera', typeNames: ['take_photo', 'pick_image', 'play_sound', 'vibrate', 'scan_qr_code'] },
      { name: 'System', icon: 'settings', typeNames: ['copy_to_clipboard', 'logout', 'refresh_page', 'print', 'download_file', 'upload_file'] }
    ];

    this.actionCategories = categories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      types: cat.typeNames
        .map(typeName => allTypes.find(t => t.type === typeName))
        .filter((type): type is ActionTypeInfo => type !== undefined)
    }));
  }

  private initializeNewAction(): void {
    this.formData = {
      name: '',
      action_type: null as any,
      target_screen: undefined,
      api_data_source: undefined,
      parameters: '',
      dialog_title: '',
      dialog_message: '',
      url: ''
    };
  }

  private loadAction(action: Action): void {
    this.formData = { ...action };

    // Parse parameters based on action type
    if (action.parameters) {
      try {
        const params = JSON.parse(action.parameters);

        switch (action.action_type) {
          case 'navigate':
            this.navigationParams = JSON.stringify(params, null, 2);
            break;
          case 'api_call':
            if (Array.isArray(params)) {
              this.apiParameters = params;
            } else if (params.parameters) {
              this.apiParameters = params.parameters;
            }
            if (params.responseHandling) {
              this.responseHandling = params.responseHandling;
            }
            break;
          case 'show_dialog':
            if (params.showCancel !== undefined) {
              this.dialogOptions.showCancel = params.showCancel;
            }
            if (params.showConfirm !== undefined) {
              this.dialogOptions.showConfirm = params.showConfirm;
            }
            break;
          case 'show_snackbar':
            if (params.duration) {
              this.snackbarDuration = params.duration;
            }
            if (params.position) {
              this.snackbarPosition = params.position;
            }
            break;
          case 'open_url':
            if (params.openInNewTab !== undefined) {
              this.openInNewTab = params.openInNewTab;
            }
            break;
          case 'send_email':
            this.emailData = params;
            break;
          case 'make_phone_call':
            this.phoneNumber = params.phoneNumber || '';
            break;
          case 'share_content':
            this.shareData = params;
            break;
          case 'toggle_visibility':
            this.visibilityWidgetId = params.widgetId || '';
            this.visibilityAction = params.action || 'toggle';
            break;
          case 'submit_form':
          case 'validate_form':
          case 'clear_form':
            this.formWidgetId = params.formId || '';
            if (params.endpoint) {
              this.formSubmitEndpoint = params.endpoint;
            }
            break;
          case 'save_data':
          case 'load_data':
            this.dataStorageKey = params.key || '';
            if (params.dataSource) {
              this.dataSource = params.dataSource;
            }
            if (params.customData) {
              this.customData = JSON.stringify(params.customData, null, 2);
            }
            break;
        }
      } catch (error) {
        console.error('Failed to parse action parameters:', error);
      }
    }
  }

  selectActionType(type: ActionType): void {
    this.formData.action_type = type;
    this.clearTypeSpecificData();
    this.clearValidationErrors();
  }

  private clearTypeSpecificData(): void {
    this.formData.target_screen = undefined;
    this.formData.api_data_source = undefined;
    this.formData.dialog_title = '';
    this.formData.dialog_message = '';
    this.formData.url = '';
    this.formData.parameters = '';
  }

  private clearValidationErrors(): void {
    this.validationErrors = {};
  }

  addApiParameter(): void {
    this.apiParameters.push({
      key: '',
      type: 'static',
      value: ''
    });
  }

  removeApiParameter(index: number): void {
    this.apiParameters.splice(index, 1);
  }

  getParameterPlaceholder(type: string): string {
    switch (type) {
      case 'static':
        return 'Enter value';
      case 'dynamic':
        return '{{variable}}';
      case 'widget':
        return 'widget.id';
      default:
        return 'Value';
    }
  }

  isValid(): boolean {
    this.validateForm();
    return Object.keys(this.validationErrors).length === 0;
  }

  private validateForm(): void {
    this.validationErrors = {};

    // Validate name
    if (!this.formData.name || this.formData.name.trim().length === 0) {
      this.validationErrors['name'] = 'Action name is required';
    }

    // Validate action type
    if (!this.formData.action_type) {
      this.validationErrors['action_type'] = 'Please select an action type';
      return;
    }

    // Type-specific validation
    switch (this.formData.action_type) {
      case 'navigate':
        if (!this.formData.target_screen) {
          this.validationErrors['target_screen'] = 'Target screen is required';
        }
        break;

      case 'api_call':
        if (!this.formData.api_data_source) {
          this.validationErrors['api_data_source'] = 'Data source is required';
        }
        break;

      case 'show_dialog':
        if (!this.formData.dialog_title) {
          this.validationErrors['dialog_title'] = 'Dialog title is required';
        }
        if (!this.formData.dialog_message) {
          this.validationErrors['dialog_message'] = 'Dialog message is required';
        }
        break;

      case 'show_snackbar':
      case 'show_toast':
        if (!this.formData.dialog_message) {
          this.validationErrors['dialog_message'] = 'Message is required';
        }
        break;

      case 'open_url':
        if (!this.formData.url) {
          this.validationErrors['url'] = 'URL is required';
        } else if (!this.isValidUrl(this.formData.url)) {
          this.validationErrors['url'] = 'Please enter a valid URL';
        }
        break;

      case 'send_email':
        if (!this.emailData.to) {
          this.validationErrors['email'] = 'Recipient email is required';
        } else if (!this.isValidEmail(this.emailData.to)) {
          this.validationErrors['email'] = 'Please enter a valid email address';
        }
        break;

      case 'make_phone_call':
        if (!this.phoneNumber) {
          this.validationErrors['phone'] = 'Phone number is required';
        }
        break;

      case 'share_content':
        if (!this.shareData.text) {
          this.validationErrors['share'] = 'Share text is required';
        }
        break;

      case 'toggle_visibility':
        if (!this.visibilityWidgetId) {
          this.validationErrors['widget'] = 'Widget ID is required';
        }
        break;

      case 'submit_form':
      case 'validate_form':
      case 'clear_form':
        if (!this.formWidgetId) {
          this.validationErrors['form'] = 'Form widget ID is required';
        }
        break;

      case 'save_data':
      case 'load_data':
        if (!this.dataStorageKey) {
          this.validationErrors['storage'] = 'Storage key is required';
        }
        break;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSave(): void {
    if (!this.isValid()) {
      return;
    }

    // Build parameters based on action type
    let parameters: any = null;

    switch (this.formData.action_type) {
      case 'navigate':
        if (this.navigationParams) {
          try {
            parameters = JSON.parse(this.navigationParams);
          } catch {
            parameters = {};
          }
        }
        break;

      case 'api_call':
        parameters = {
          parameters: this.apiParameters,
          responseHandling: this.responseHandling
        };
        break;

      case 'show_dialog':
        parameters = {
          showCancel: this.dialogOptions.showCancel,
          showConfirm: this.dialogOptions.showConfirm
        };
        break;

      case 'show_snackbar':
        parameters = {
          duration: this.snackbarDuration,
          position: this.snackbarPosition
        };
        break;

      case 'open_url':
        parameters = {
          openInNewTab: this.openInNewTab
        };
        break;

      case 'send_email':
        parameters = this.emailData;
        break;

      case 'make_phone_call':
        parameters = {
          phoneNumber: this.phoneNumber
        };
        break;

      case 'share_content':
        parameters = this.shareData;
        break;

      case 'toggle_visibility':
        parameters = {
          widgetId: this.visibilityWidgetId,
          action: this.visibilityAction
        };
        break;

      case 'submit_form':
        parameters = {
          formId: this.formWidgetId,
          endpoint: this.formSubmitEndpoint
        };
        break;

      case 'validate_form':
      case 'clear_form':
        parameters = {
          formId: this.formWidgetId
        };
        break;

      case 'save_data':
        parameters = {
          key: this.dataStorageKey,
          dataSource: this.dataSource
        };
        if (this.dataSource === 'custom' && this.customData) {
          try {
            parameters.customData = JSON.parse(this.customData);
          } catch {
            parameters.customData = {};
          }
        }
        break;

      case 'load_data':
        parameters = {
          key: this.dataStorageKey
        };
        break;
    }

    // Prepare action data
    const actionData: Partial<Action> = {
      ...this.formData,
      parameters: parameters ? JSON.stringify(parameters) : ''
    };

    this.save.emit(actionData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Helper methods
  getActionIcon(): string {
    if (!this.formData.action_type) return 'touch_app';

    const typeInfo = this.actionService.getActionTypeInfo()
      .find(info => info.type === this.formData.action_type);
    return typeInfo?.icon || 'touch_app';
  }

  getActionTypeLabel(): string {
    if (!this.formData.action_type) return 'No type selected';

    const typeInfo = this.actionService.getActionTypeInfo()
      .find(info => info.type === this.formData.action_type);
    return typeInfo?.label || this.formData.action_type.replace(/_/g, ' ');
  }

  getActionColor(): string {
    const category = this.getActionCategory();
    const colors: Record<string, string> = {
      'Navigation': '#4CAF50',
      'Data': '#2196F3',
      'UI': '#9C27B0',
      'External': '#FF9800',
      'Form': '#00BCD4',
      'Media': '#F44336',
      'System': '#607D8B'
    };
    return colors[category] || '#9E9E9E';
  }

  getActionCategory(): string {
    if (!this.formData.action_type) return 'Other';

    for (const category of this.actionCategories) {
      if (category.types.some(t => t.type === this.formData.action_type)) {
        return category.name;
      }
    }
    return 'Other';
  }

  getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Navigation': '#4CAF50',
      'Data': '#2196F3',
      'UI': '#9C27B0',
      'External': '#FF9800',
      'Form': '#00BCD4',
      'Media': '#F44336',
      'System': '#607D8B'
    };
    return colors[categoryName] || '#9E9E9E';
  }

  getScreenName(screenId: number): string {
    const screen = this.screens.find(s => s.id === screenId);
    return screen?.name || 'Unknown Screen';
  }

  getDataSourceName(dataSourceId: number): string {
    const dataSource = this.dataSources.find(ds => ds.id === dataSourceId);
    return dataSource?.name || 'Unknown Data Source';
  }
}
