// src/app/features/builder/toolbar/toolbar.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Application } from '../../../core/models/application.model';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { UndoRedoService } from '../../../core/services/undo-redo.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  animations: [
    trigger('saveAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() application: Application | null = null;
  @Output() save = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() build = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() zoomChange = new EventEmitter<number>();
  @Output() deviceChange = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();

  currentZoom = 100;
  currentDevice = 'iphone14';
  autoSaveEnabled = true;
  lastSaved: Date | null = null;
  canUndo = false;
  canRedo = false;
  showGridLines = false;
  showSettingsMenu = false;
  isSaving = false;
  showSaveIndicator = false;

  devices = [
    { id: 'iphone14', name: 'iPhone 14', icon: 'phone_iphone' },
    { id: 'iphone14pro', name: 'iPhone 14 Pro', icon: 'phone_iphone' },
    { id: 'iphone14promax', name: 'iPhone 14 Pro Max', icon: 'phone_iphone' },
    { id: 'iphonese', name: 'iPhone SE', icon: 'phone_iphone' },
    { id: 'android', name: 'Android', icon: 'phone_android' },
    { id: 'pixel7', name: 'Pixel 7', icon: 'phone_android' },
    { id: 'galaxys22', name: 'Galaxy S22', icon: 'phone_android' },
    { id: 'ipadmini', name: 'iPad Mini', icon: 'tablet_mac' },
    { id: 'ipadpro', name: 'iPad Pro', icon: 'tablet_mac' }
  ];

  zoomPresets = [25, 50, 75, 100, 125, 150, 200];

  private autoSaveSubscription?: Subscription;
  private autoSaveTimer?: any;
  private hasUnsavedChanges = false;

  constructor(
    private keyboardService: KeyboardService,
    private undoRedoService: UndoRedoService
  ) {}

  ngOnInit(): void {
    this.setupKeyboardShortcuts();
    this.setupAutoSave();
    this.subscribeToUndoRedo();
  }

  ngOnDestroy(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  private setupKeyboardShortcuts(): void {
    this.keyboardService.registerDefaultShortcuts({
      save: () => this.onSave(),
      undo: () => this.onUndo(),
      redo: () => this.onRedo(),
      preview: () => this.preview.emit()
    });

    // Register zoom shortcuts
    this.keyboardService.registerShortcut('ctrl+=', () => this.onZoomIn());
    this.keyboardService.registerShortcut('ctrl+-', () => this.onZoomOut());
    this.keyboardService.registerShortcut('ctrl+0', () => this.onZoomReset());
  }

  private setupAutoSave(): void {
    if (this.autoSaveEnabled) {
      // Auto-save every 30 seconds if there are changes
      this.autoSaveTimer = setInterval(() => {
        if (this.hasUnsavedChanges && this.autoSaveEnabled) {
          this.onSave();
        }
      }, 30000);
    }
  }

  private subscribeToUndoRedo(): void {
    this.undoRedoService.canUndo$.subscribe(canUndo => {
      this.canUndo = canUndo;
    });

    this.undoRedoService.canRedo$.subscribe(canRedo => {
      this.canRedo = canRedo;
    });
  }

  onZoomIn(): void {
    this.currentZoom = Math.min(200, this.currentZoom + 10);
    this.zoomChange.emit(this.currentZoom);
  }

  onZoomOut(): void {
    this.currentZoom = Math.max(25, this.currentZoom - 10);
    this.zoomChange.emit(this.currentZoom);
  }

  onZoomReset(): void {
    this.currentZoom = 100;
    this.zoomChange.emit(this.currentZoom);
  }

  onDeviceSelect(deviceId: string): void {
    this.currentDevice = deviceId;
    this.deviceChange.emit(deviceId);
  }

  onSave(): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.save.emit();

    // Simulate save completion (in real app, this would be triggered by the save service)
    setTimeout(() => {
      this.isSaving = false;
      this.lastSaved = new Date();
      this.hasUnsavedChanges = false;
      this.showSaveAnimation();
    }, 1000);
  }

  onUndo(): void {
    if (this.canUndo) {
      this.undo.emit();
      this.hasUnsavedChanges = true;
    }
  }

  onRedo(): void {
    if (this.canRedo) {
      this.redo.emit();
      this.hasUnsavedChanges = true;
    }
  }

  toggleGrid(): void {
    this.showGridLines = !this.showGridLines;
  }

  toggleAutoSave(): void {
    this.autoSaveEnabled = !this.autoSaveEnabled;
    this.showSettingsMenu = false;

    if (this.autoSaveEnabled) {
      this.setupAutoSave();
    } else if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  toggleSettingsMenu(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  exportProject(): void {
    this.showSettingsMenu = false;
    // Implement export functionality
    console.log('Export project');
  }

  projectSettings(): void {
    this.showSettingsMenu = false;
    // Implement project settings
    console.log('Project settings');
  }

  showKeyboardShortcuts(): void {
    this.showSettingsMenu = false;
    // Show keyboard shortcuts dialog
    console.log('Show keyboard shortcuts');
  }

  showSaveAnimation(): void {
    this.showSaveIndicator = true;
    setTimeout(() => {
      this.showSaveIndicator = false;
    }, 2000);
  }

  getSaveButtonText(): string {
    if (this.isSaving) {
      return 'Saving...';
    }
    return this.lastSaved ? 'Save' : 'Save';
  }

  getLastSavedText(): string {
    if (!this.lastSaved) return 'Not saved';

    const now = new Date();
    const diff = now.getTime() - this.lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 5) return 'Just saved';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Public method to mark changes
  markAsChanged(): void {
    this.hasUnsavedChanges = true;
  }
}
