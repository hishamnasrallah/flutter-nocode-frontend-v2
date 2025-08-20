// src/app/features/builder/screen-manager/screen-manager.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Application } from '../../../core/models/application.model';
import { Screen } from '../../../core/models/screen.model';
import { ScreenService } from '../../../core/services/screen.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-screen-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './screen-manager.component.html',
  styleUrls: ['./screen-manager.component.scss']
})
export class ScreenManagerComponent implements OnInit, OnDestroy {
  @Input() application: Application | null = null;
  @Input() currentScreen: Screen | null = null;

  private destroy$ = new Subject<void>();

  screens: Screen[] = [];
  editingScreen: Screen | null = null;
  duplicatingScreen: Screen | null = null;
  showAddDialog = false;
  selectedTemplate = 'blank';

  // Forms
  screenForm: FormGroup;
  newScreenForm: FormGroup;
  duplicateForm: FormGroup;

  // Drag and drop
  draggingScreen: Screen | null = null;
  draggingIndex = -1;
  showDropIndicator = false;
  dropIndicatorPosition = 0;

  constructor(
    private fb: FormBuilder,
    private screenService: ScreenService,
    private notificationService: NotificationService
  ) {
    // Initialize forms
    this.screenForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      route_name: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      app_bar_title: [''],
      is_home_screen: [false],
      show_app_bar: [true],
      show_back_button: [false],
      background_color: ['#FFFFFF']
    });

    this.newScreenForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      route_name: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
    });

    this.duplicateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      route_name: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      copy_widgets: [true]
    });

    // Watch for show_app_bar changes
    this.screenForm.get('show_app_bar')?.valueChanges.subscribe(showAppBar => {
      if (!showAppBar) {
        this.screenForm.patchValue({ show_back_button: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadScreens();

    // Subscribe to screen service updates
    this.screenService.screens$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screens => {
        this.screens = screens;
      });

    this.screenService.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screen => {
        this.currentScreen = screen;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadScreens(): void {
    if (!this.application) return;

    this.screenService.getScreens(this.application.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Failed to load screens:', error);
          this.notificationService.error('Failed to load screens');
        }
      });
  }

  selectScreen(screen: Screen): void {
    this.screenService.setCurrentScreen(screen);
    this.editingScreen = null;
  }

  addScreen(): void {
    this.showAddDialog = true;
    this.selectedTemplate = 'blank';
    this.newScreenForm.reset({
      name: 'New Screen',
      route_name: this.generateUniqueRoute('new-screen')
    });
  }

  createScreen(): void {
    if (!this.application || this.newScreenForm.invalid) return;

    const formValue = this.newScreenForm.value;
    const screenData = {
      application: this.application.id,
      name: formValue.name,
      route_name: `/${formValue.route_name}`,
      is_home_screen: this.screens.length === 0,
      app_bar_title: formValue.name,
      show_app_bar: this.selectedTemplate !== 'blank',
      show_back_button: false,
      background_color: '#FFFFFF'
    };

    this.screenService.createScreen(screenData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (screen) => {
          this.notificationService.success(`Screen "${screen.name}" created successfully`);
          this.closeAddDialog();

          // Add widgets based on template
          if (this.selectedTemplate === 'withNavigation') {
            // TODO: Add navigation widgets
          }
        },
        error: (error) => {
          console.error('Failed to create screen:', error);
          this.notificationService.error('Failed to create screen');
        }
      });
  }

  editScreen(screen: Screen, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.editingScreen = screen;
    this.screenForm.patchValue({
      name: screen.name,
      route_name: screen.route_name.substring(1), // Remove leading /
      app_bar_title: screen.app_bar_title || '',
      is_home_screen: screen.is_home_screen,
      show_app_bar: screen.show_app_bar,
      show_back_button: screen.show_back_button,
      background_color: screen.background_color || '#FFFFFF'
    });
    this.screenForm.markAsPristine();
  }

  saveScreen(): void {
    if (!this.editingScreen || this.screenForm.invalid) return;

    const formValue = this.screenForm.value;
    const updateData = {
      name: formValue.name,
      route_name: `/${formValue.route_name}`,
      app_bar_title: formValue.app_bar_title,
      is_home_screen: formValue.is_home_screen,
      show_app_bar: formValue.show_app_bar,
      show_back_button: formValue.show_back_button,
      background_color: formValue.background_color
    };

    this.screenService.updateScreen(this.editingScreen.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (screen) => {
          this.notificationService.success('Screen updated successfully');
          this.editingScreen = null;

          // If setting as home screen, update others
          if (formValue.is_home_screen && !this.editingScreen?.is_home_screen) {
            this.setAsHome(screen);
          }
        },
        error: (error) => {
          console.error('Failed to update screen:', error);
          this.notificationService.error('Failed to update screen');
        }
      });
  }

  cancelEdit(): void {
    this.editingScreen = null;
  }

  deleteScreen(screen: Screen, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.screens.length <= 1) {
      this.notificationService.warning('Cannot delete the last screen');
      return;
    }

    if (confirm(`Delete screen "${screen.name}"? This will also delete all widgets on this screen.`)) {
      this.screenService.deleteScreen(screen.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.success(`Screen "${screen.name}" deleted successfully`);
          },
          error: (error) => {
            console.error('Failed to delete screen:', error);
            this.notificationService.error('Failed to delete screen');
          }
        });
    }
  }

  duplicateScreen(screen: Screen): void {
    this.duplicatingScreen = screen;
    this.duplicateForm.patchValue({
      name: `${screen.name} Copy`,
      route_name: this.generateUniqueRoute(screen.route_name.substring(1)),
      copy_widgets: true
    });
  }

  confirmDuplicate(): void {
    if (!this.duplicatingScreen || this.duplicateForm.invalid) return;

    const formValue = this.duplicateForm.value;

    this.screenService.duplicateScreen(this.duplicatingScreen.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newScreen) => {
          // Update with new name and route
          const updateData = {
            name: formValue.name,
            route_name: `/${formValue.route_name}`,
            is_home_screen: false
          };

          this.screenService.updateScreen(newScreen.id, updateData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (screen) => {
                this.notificationService.success(`Screen duplicated as "${screen.name}"`);
                this.closeDuplicateDialog();
                this.selectScreen(screen);
              }
            });
        },
        error: (error) => {
          console.error('Failed to duplicate screen:', error);
          this.notificationService.error('Failed to duplicate screen');
        }
      });
  }

  closeDuplicateDialog(): void {
    this.duplicatingScreen = null;
  }

  setAsHome(screen: Screen): void {
    this.screenService.setHomeScreen(screen.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(`"${screen.name}" is now the home screen`);
        },
        error: (error) => {
          console.error('Failed to set home screen:', error);
          this.notificationService.error('Failed to set home screen');
        }
      });
  }

  // Tab drag and drop
  onTabDragStart(event: DragEvent, screen: Screen, index: number): void {
    this.draggingScreen = screen;
    this.draggingIndex = index;

    const target = event.target as HTMLElement;
    target.classList.add('dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', screen.id.toString());
    }
  }

  onTabDragEnd(event: DragEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('dragging');

    this.draggingScreen = null;
    this.draggingIndex = -1;
    this.showDropIndicator = false;
  }

  onTabDragOver(event: DragEvent): void {
    if (!this.draggingScreen) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    // Calculate drop position
    const container = event.currentTarget as HTMLElement;
    const tabs = Array.from(container.querySelectorAll('.screen-tab'));
    const x = event.clientX;

    let dropIndex = tabs.length;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i] as HTMLElement;
      const rect = tab.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      if (x < center) {
        dropIndex = i;
        break;
      }
    }

    // Show drop indicator
    if (dropIndex !== this.draggingIndex && dropIndex !== this.draggingIndex + 1) {
      this.showDropIndicator = true;

      if (dropIndex < tabs.length) {
        const tab = tabs[dropIndex] as HTMLElement;
        this.dropIndicatorPosition = tab.offsetLeft - 1;
      } else if (tabs.length > 0) {
        const lastTab = tabs[tabs.length - 1] as HTMLElement;
        this.dropIndicatorPosition = lastTab.offsetLeft + lastTab.offsetWidth - 1;
      }
    } else {
      this.showDropIndicator = false;
    }
  }

  onTabDrop(event: DragEvent): void {
    if (!this.draggingScreen) return;

    event.preventDefault();

    // Calculate new order
    const container = event.currentTarget as HTMLElement;
    const tabs = Array.from(container.querySelectorAll('.screen-tab'));
    const x = event.clientX;

    let dropIndex = tabs.length;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i] as HTMLElement;
      const rect = tab.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      if (x < center) {
        dropIndex = i;
        break;
      }
    }

    // Adjust for removal of dragged item
    if (dropIndex > this.draggingIndex) {
      dropIndex--;
    }

    // Reorder screens
    if (dropIndex !== this.draggingIndex) {
      const newScreens = [...this.screens];
      const [removed] = newScreens.splice(this.draggingIndex, 1);
      newScreens.splice(dropIndex, 0, removed);

      // Update screen order
      this.screenService.reorderScreens(newScreens.map(s => s.id));
      this.notificationService.success('Screen order updated');
    }

    this.showDropIndicator = false;
  }

  selectTemplate(template: string): void {
    this.selectedTemplate = template;
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
  }

  isActiveScreen(screen: Screen): boolean {
    return this.currentScreen?.id === screen.id;
  }

  getRouteError(): string {
    const control = this.screenForm.get('route_name');
    if (control?.hasError('required')) {
      return 'Route is required';
    }
    if (control?.hasError('pattern')) {
      return 'Route can only contain lowercase letters, numbers, and hyphens';
    }
    return '';
  }

  private generateUniqueRoute(baseName: string): string {
    let route = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    let counter = 1;

    while (this.screens.some(s => s.route_name === `/${route}`)) {
      route = `${baseName}-${counter}`;
      counter++;
    }

    return route;
  }
}
