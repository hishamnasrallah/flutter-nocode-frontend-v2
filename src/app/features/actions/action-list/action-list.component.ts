// src/app/features/actions/action-list/action-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActionService } from '../../../core/services/action.service';
import { ApplicationService } from '../../../core/services/application.service';
import { ScreenService } from '../../../core/services/screen.service';
import { DataSourceService } from '../../../core/services/data-source.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Action, ActionType, ActionTypeInfo } from '../../../core/models/action.model';
import { Application } from '../../../core/models/application.model';
import { Screen } from '../../../core/models/screen.model';
import { DataSource } from '../../../core/models/data-source.model';
import { ActionEditorComponent } from '../action-editor/action-editor.component';

interface ActionCategory {
  name: string;
  icon: string;
  types: ActionType[];
}

@Component({
  selector: 'app-action-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionEditorComponent],
  templateUrl: './action-list.component.html',
  styleUrls: ['./action-list.component.scss']
})
export class ActionListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  actions: Action[] = [];
  filteredActions: Action[] = [];
  groupedActions: Map<string, Action[]> = new Map();
  currentApplication: Application | null = null;
  screens: Screen[] = [];
  dataSources: DataSource[] = [];

  // UI State
  searchQuery = '';
  selectedCategory = 'all';
  selectedAction: Action | null = null;
  showEditor = false;
  editingAction: Action | null = null;
  isLoading = false;
  actionMenuOpen: number | null = null;
  showTestDialog = false;
  testingAction: Action | null = null;

  // Action categories
  actionCategories: ActionCategory[] = [
    {
      name: 'Navigation',
      icon: 'navigation',
      types: ['navigate', 'navigate_back'] as ActionType[]
    },
    {
      name: 'Data',
      icon: 'cloud',
      types: ['api_call', 'save_data', 'load_data', 'refresh_data'] as ActionType[]
    },
    {
      name: 'UI',
      icon: 'widgets',
      types: ['show_dialog', 'show_snackbar', 'toggle_visibility', 'show_toast'] as ActionType[]
    },
    {
      name: 'External',
      icon: 'open_in_new',
      types: ['open_url', 'share_content', 'send_email', 'make_phone_call'] as ActionType[]
    },
    {
      name: 'Form',
      icon: 'description',
      types: ['submit_form', 'validate_form', 'clear_form'] as ActionType[]
    },
    {
      name: 'Media',
      icon: 'photo_camera',
      types: ['take_photo', 'pick_image', 'play_sound', 'vibrate', 'scan_qr_code'] as ActionType[]
    },
    {
      name: 'System',
      icon: 'settings',
      types: ['copy_to_clipboard', 'logout', 'refresh_page', 'print', 'download_file', 'upload_file'] as ActionType[]
    }
  ];

  // Action type info
  private actionTypeInfo: Map<ActionType, ActionTypeInfo>;

  constructor(
    private actionService: ActionService,
    private applicationService: ApplicationService,
    private screenService: ScreenService,
    private dataSourceService: DataSourceService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Initialize action type info map
    this.actionTypeInfo = new Map(
      this.actionService.getActionTypeInfo().map(info => [info.type, info])
    );
  }

  ngOnInit(): void {
    this.loadApplicationContext();
    this.loadActions();
    this.loadScreens();
    this.loadDataSources();

    // Subscribe to application changes
    this.applicationService.currentApplication$
      .pipe(takeUntil(this.destroy$))
      .subscribe(app => {
        this.currentApplication = app;
        if (app) {
          this.loadActions();
          this.loadScreens();
          this.loadDataSources();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplicationContext(): void {
    this.currentApplication = this.applicationService.currentApplication;
    if (!this.currentApplication) {
      // Try to get from localStorage
      const appId = localStorage.getItem('current_app_id');
      if (appId) {
        this.applicationService.getApplication(parseInt(appId, 10))
          .pipe(takeUntil(this.destroy$))
          .subscribe();
      }
    }
  }

  loadActions(): void {
    if (!this.currentApplication) return;

    this.isLoading = true;
    this.actionService.getActions(this.currentApplication.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.actions = response.results;
          this.filterActions();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load actions:', error);
          this.notificationService.error('Failed to load actions');
          this.isLoading = false;
        }
      });
  }

  loadScreens(): void {
    if (!this.currentApplication) return;

    this.screenService.getScreens(this.currentApplication.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.screens = response.results;
        },
        error: (error) => {
          console.error('Failed to load screens:', error);
        }
      });
  }

  loadDataSources(): void {
    if (!this.currentApplication) return;

    this.dataSourceService.getDataSources(this.currentApplication.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSources = response.results;
        },
        error: (error) => {
          console.error('Failed to load data sources:', error);
        }
      });
  }

  filterActions(): void {
    let filtered = [...this.actions];

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(action =>
        action.name.toLowerCase().includes(query) ||
        action.action_type.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      const category = this.actionCategories.find(c => c.name === this.selectedCategory);
      if (category) {
        filtered = filtered.filter(action =>
          category.types.includes(action.action_type)
        );
      }
    }

    this.filteredActions = filtered;
    this.groupActions();
  }

  groupActions(): void {
    this.groupedActions.clear();

    this.filteredActions.forEach(action => {
      const category = this.getActionCategory(action.action_type);
      if (!this.groupedActions.has(category)) {
        this.groupedActions.set(category, []);
      }
      this.groupedActions.get(category)!.push(action);
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.filterActions();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterActions();
  }

  selectAction(action: Action): void {
    this.selectedAction = action;
  }

  openActionEditor(action: Action | null): void {
    this.editingAction = action;
    this.showEditor = true;
  }

  closeEditor(): void {
    this.showEditor = false;
    this.editingAction = null;
  }

  editAction(action: Action): void {
    this.openActionEditor(action);
  }

  duplicateAction(action: Action): void {
    if (!this.currentApplication) return;

    const duplicatedAction = {
      ...action,
      name: `${action.name} (Copy)`,
      application: this.currentApplication.id
    };

    delete (duplicatedAction as any).id;
    delete (duplicatedAction as any).created_at;
    delete (duplicatedAction as any).updated_at;

    this.actionService.createAction(duplicatedAction)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newAction) => {
          this.notificationService.success(`Action "${newAction.name}" created successfully`);
          this.loadActions();
        },
        error: (error) => {
          console.error('Failed to duplicate action:', error);
          this.notificationService.error('Failed to duplicate action');
        }
      });
  }

  deleteAction(action: Action): void {
    if (confirm(`Delete action "${action.name}"? This cannot be undone.`)) {
      this.actionService.deleteAction(action.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success(`Action "${action.name}" deleted successfully`);
            this.loadActions();
            if (this.selectedAction?.id === action.id) {
              this.selectedAction = null;
            }
          },
          error: (error) => {
            console.error('Failed to delete action:', error);
            this.notificationService.error('Failed to delete action');
          }
        });
    }
  }

  testAction(action: Action): void {
    this.testingAction = action;
    this.showTestDialog = true;
  }

  closeTestDialog(): void {
    this.showTestDialog = false;
    this.testingAction = null;
  }

  executeTest(): void {
    if (!this.testingAction) return;

    // Simulate action execution
    switch (this.testingAction.action_type) {
      case 'show_dialog':
        this.notificationService.info('Dialog would be shown in the app');
        break;
      case 'show_snackbar':
        this.notificationService.info(this.testingAction.dialog_message || 'Snackbar message');
        break;
      case 'navigate':
        this.notificationService.info(`Navigation to ${this.getScreenName(this.testingAction.target_screen!)} simulated`);
        break;
      case 'api_call':
        this.notificationService.info('API call would be executed');
        break;
      default:
        this.notificationService.info(`Action "${this.testingAction.name}" would be executed`);
    }

    this.closeTestDialog();
  }

  onActionSave(action: Partial<Action>): void {
    if (!this.currentApplication) return;

    const actionData = {
      ...action,
      application: this.currentApplication.id
    };

    const request = this.editingAction
      ? this.actionService.updateAction(this.editingAction.id, actionData)
      : this.actionService.createAction(actionData);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (savedAction) => {
        const message = this.editingAction ? 'Action updated successfully' : 'Action created successfully';
        this.notificationService.success(message);
        this.loadActions();
        this.closeEditor();
      },
      error: (error) => {
        console.error('Failed to save action:', error);
        this.notificationService.error('Failed to save action');
      }
    });
  }

  toggleActionMenu(event: MouseEvent, action: Action): void {
    event.stopPropagation();
    this.actionMenuOpen = this.actionMenuOpen === action.id ? null : action.id;
  }

  closeActionMenu(): void {
    this.actionMenuOpen = null;
  }

  // Helper methods
  getActionCategory(actionType: ActionType): string {
    for (const category of this.actionCategories) {
      if (category.types.includes(actionType)) {
        return category.name;
      }
    }
    return 'Other';
  }

  getCategoryIcon(category: string): string {
    const cat = this.actionCategories.find(c => c.name === category);
    return cat?.icon || 'category';
  }

  getCategoryCount(category: string): number {
    return this.actions.filter(action => {
      const cat = this.actionCategories.find(c => c.name === category);
      return cat?.types.includes(action.action_type);
    }).length;
  }

  getTotalActionsCount(): number {
    return this.actions.length;
  }

  getActionIcon(actionType: ActionType): string {
    const info = this.actionTypeInfo.get(actionType);
    return info?.icon || 'touch_app';
  }

  getActionTypeLabel(actionType: ActionType): string {
    const info = this.actionTypeInfo.get(actionType);
    return info?.label || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getActionColor(actionType: ActionType): string {
    const category = this.getActionCategory(actionType);
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

  getScreenName(screenId: number): string {
    const screen = this.screens.find(s => s.id === screenId);
    return screen?.name || 'Unknown Screen';
  }

  getDataSourceName(dataSourceId: number): string {
    const dataSource = this.dataSources.find(ds => ds.id === dataSourceId);
    return dataSource?.name || 'Unknown Data Source';
  }

  getEmailRecipient(parameters: string): string {
    try {
      const params = JSON.parse(parameters);
      return params.recipient || 'No recipient';
    } catch {
      return 'Invalid parameters';
    }
  }

  isActionUsed(action: Action): boolean {
    // This would check if the action is referenced by any widgets
    // For now, return a random value for demo
    return Math.random() > 0.5;
  }

  hasValidationErrors(action: Action): boolean {
    const errors = this.actionService.validateAction(action);
    return errors.length > 0;
  }
}
