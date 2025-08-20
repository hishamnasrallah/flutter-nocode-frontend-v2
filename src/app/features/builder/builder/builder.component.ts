// src/app/features/builder/builder/builder.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CanvasComponent } from '../canvas/canvas.component';
import { WidgetPanelComponent } from '../widget-panel/widget-panel.component';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';
import { ScreenManagerComponent } from '../screen-manager/screen-manager.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { WidgetTreeComponent } from '../widget-tree/widget-tree.component';
import { PreviewComponent } from '../preview/preview.component';
import { ApplicationService } from '../../../core/services/application.service';
import { ScreenService } from '../../../core/services/screen.service';
import { WidgetService } from '../../../core/services/widget.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Application } from '../../../core/models/application.model';
import { Screen } from '../../../core/models/screen.model';
import { Widget } from '../../../core/models/widget.model';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [
    CommonModule,
    CanvasComponent,
    WidgetPanelComponent,
    PropertiesPanelComponent,
    ScreenManagerComponent,
    ToolbarComponent,
    WidgetTreeComponent,
    PreviewComponent
  ],
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss']
})
export class BuilderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  application: Application | null = null;
  currentScreen: Screen | null = null;
  selectedWidget: Widget | null = null;
  widgets: Widget[] = [];

  isLoading = true;
  showPreview = false;
  showWidgetTree = false;
  showProperties = true;

  leftPanelTab: 'widgets' | 'tree' | 'screens' = 'widgets';
  rightPanelTab: 'properties' | 'actions' | 'data' = 'properties';

  deviceType: 'iphone14' | 'android' | 'ipad' | 'custom' = 'iphone14';
  zoom = 100;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private screenService: ScreenService,
    private widgetService: WidgetService,
    private dragDropService: DragDropService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('appId');
    if (appId) {
      this.loadApplication(parseInt(appId, 10));
    } else {
      this.notificationService.error('Invalid application ID');
      this.router.navigate(['/dashboard']);
    }

    this.subscribeToServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplication(appId: number): void {
    this.isLoading = true;

    this.applicationService.getApplication(appId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (app) => {
          this.application = app;
          this.loadScreens();
        },
        error: (error) => {
          console.error('Failed to load application:', error);
          this.notificationService.error('Failed to load application');
          this.router.navigate(['/dashboard']);
        }
      });
  }

  private loadScreens(): void {
    if (!this.application) return;

    this.screenService.getScreens(this.application.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.results.length === 0) {
            // Create default screen if none exist
            this.createDefaultScreen();
          } else {
            // Load widgets for current screen
            this.loadWidgets();
          }
        },
        error: (error) => {
          console.error('Failed to load screens:', error);
          this.notificationService.error('Failed to load screens');
        }
      });
  }

  private createDefaultScreen(): void {
    if (!this.application) return;

    const defaultScreen = {
      application: this.application.id,
      name: 'Home Screen',
      route_name: '/home',
      is_home_screen: true,
      app_bar_title: this.application.name,
      show_app_bar: true,
      show_back_button: false
    };

    this.screenService.createScreen(defaultScreen)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWidgets();
        },
        error: (error) => {
          console.error('Failed to create default screen:', error);
          this.notificationService.error('Failed to create default screen');
        }
      });
  }

  private loadWidgets(): void {
    const currentScreen = this.screenService.currentScreen;
    if (!currentScreen) {
      this.isLoading = false;
      return;
    }

    this.currentScreen = currentScreen;

    this.widgetService.getWidgets(currentScreen.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.widgets = response.results;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load widgets:', error);
          this.notificationService.error('Failed to load widgets');
          this.isLoading = false;
        }
      });
  }

  private subscribeToServices(): void {
    // Subscribe to screen changes
    this.screenService.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screen => {
        if (screen && screen !== this.currentScreen) {
          this.currentScreen = screen;
          this.loadWidgets();
        }
      });

    // Subscribe to widget selection
    this.widgetService.selectedWidget$
      .pipe(takeUntil(this.destroy$))
      .subscribe(widget => {
        this.selectedWidget = widget;
      });

    // Subscribe to widgets changes
    this.widgetService.widgets$
      .pipe(takeUntil(this.destroy$))
      .subscribe(widgets => {
        this.widgets = widgets;
      });
  }

  onSave(): void {
    this.notificationService.success('Project saved successfully');
  }

  onPreview(): void {
    this.showPreview = true;
  }

  onClosePreview(): void {
    this.showPreview = false;
  }

  onBuild(): void {
    if (!this.application) return;

    this.applicationService.buildApplication(this.application.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Build started successfully');
        },
        error: (error) => {
          console.error('Failed to start build:', error);
          this.notificationService.error('Failed to start build');
        }
      });
  }

  onUndo(): void {
    // Implement undo functionality
    this.notificationService.info('Undo functionality coming soon');
  }

  onRedo(): void {
    // Implement redo functionality
    this.notificationService.info('Redo functionality coming soon');
  }

  onZoomChange(zoom: number): void {
    this.zoom = zoom;
  }

  onDeviceChange(device: string): void {
    this.deviceType = device as any;
  }

  onWidgetDropped(event: any): void {
    if (!this.currentScreen) {
      this.notificationService.error('No screen selected');
      return;
    }

    const createRequest = {
      screen: this.currentScreen.id,
      widget_type: event.widgetType,
      parent_widget: event.targetParentId,
      order: event.targetIndex
    };

    this.widgetService.createWidget(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (widget) => {
          this.notificationService.success(`${event.widgetType} added successfully`);
        },
        error: (error) => {
          console.error('Failed to create widget:', error);
          this.notificationService.error('Failed to add widget');
        }
      });
  }

  onWidgetSelected(widget: Widget): void {
    this.widgetService.selectWidget(widget);
  }

  onWidgetDeleted(widgetId: number): void {
    this.widgetService.deleteWidget(widgetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Widget deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete widget:', error);
          this.notificationService.error('Failed to delete widget');
        }
      });
  }

  toggleLeftPanelTab(tab: 'widgets' | 'tree' | 'screens'): void {
    this.leftPanelTab = tab;
  }

  toggleRightPanelTab(tab: 'properties' | 'actions' | 'data'): void {
    this.rightPanelTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
