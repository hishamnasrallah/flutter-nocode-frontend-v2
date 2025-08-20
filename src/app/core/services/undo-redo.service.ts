// src/app/core/services/undo-redo.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Command {
  id: string;
  timestamp: Date;
  execute: () => void;
  undo: () => void;
  description: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class UndoRedoService {
  private history: Command[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;
  private isExecutingCommand = false;

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  public canUndo$ = this.canUndoSubject.asObservable();

  private canRedoSubject = new BehaviorSubject<boolean>(false);
  public canRedo$ = this.canRedoSubject.asObservable();

  private historyChangedSubject = new BehaviorSubject<Command[]>([]);
  public historyChanged$ = this.historyChangedSubject.asObservable();

  executeCommand(command: Command): void {
    if (this.isExecutingCommand) return;

    try {
      this.isExecutingCommand = true;

      // Remove any commands after current index (we're branching)
      this.history = this.history.slice(0, this.currentIndex + 1);

      // Execute the command
      command.execute();

      // Add to history
      this.history.push(command);
      this.currentIndex++;

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.currentIndex--;
      }

      this.updateCanStates();
      this.notifyHistoryChanged();
    } finally {
      this.isExecutingCommand = false;
    }
  }

  undo(): void {
    if (this.currentIndex < 0 || this.isExecutingCommand) return;

    try {
      this.isExecutingCommand = true;

      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;

      this.updateCanStates();
      this.notifyHistoryChanged();
    } finally {
      this.isExecutingCommand = false;
    }
  }

  redo(): void {
    if (this.currentIndex >= this.history.length - 1 || this.isExecutingCommand) return;

    try {
      this.isExecutingCommand = true;

      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();

      this.updateCanStates();
      this.notifyHistoryChanged();
    } finally {
      this.isExecutingCommand = false;
    }
  }

  private updateCanStates(): void {
    this.canUndoSubject.next(this.currentIndex >= 0);
    this.canRedoSubject.next(this.currentIndex < this.history.length - 1);
  }

  private notifyHistoryChanged(): void {
    this.historyChangedSubject.next(this.getHistory());
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.updateCanStates();
    this.notifyHistoryChanged();
  }

  getHistory(): Command[] {
    return this.history.slice(0, this.currentIndex + 1);
  }

  getFutureHistory(): Command[] {
    return this.history.slice(this.currentIndex + 1);
  }

  getLastCommand(): Command | null {
    if (this.currentIndex >= 0) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Command factories for common operations
  createAddWidgetCommand(
    widget: any,
    addFn: () => void,
    removeFn: () => void
  ): Command {
    return {
      id: `add-widget-${widget.id}-${Date.now()}`,
      timestamp: new Date(),
      execute: addFn,
      undo: removeFn,
      description: `Add ${widget.widget_type}`,
      data: { widget }
    };
  }

  createDeleteWidgetCommand(
    widget: any,
    deleteFn: () => void,
    restoreFn: () => void
  ): Command {
    return {
      id: `delete-widget-${widget.id}-${Date.now()}`,
      timestamp: new Date(),
      execute: deleteFn,
      undo: restoreFn,
      description: `Delete ${widget.widget_type}`,
      data: { widget }
    };
  }

  createPropertyChangeCommand(
    widgetId: number,
    propertyName: string,
    oldValue: any,
    newValue: any,
    changeFn: (value: any) => void
  ): Command {
    return {
      id: `change-${widgetId}-${propertyName}-${Date.now()}`,
      timestamp: new Date(),
      execute: () => changeFn(newValue),
      undo: () => changeFn(oldValue),
      description: `Change ${propertyName}`,
      data: { widgetId, propertyName, oldValue, newValue }
    };
  }

  createMoveWidgetCommand(
    widget: any,
    oldParent: number | null,
    newParent: number | null,
    oldIndex: number,
    newIndex: number,
    moveFn: (parent: number | null, index: number) => void
  ): Command {
    return {
      id: `move-widget-${widget.id}-${Date.now()}`,
      timestamp: new Date(),
      execute: () => moveFn(newParent, newIndex),
      undo: () => moveFn(oldParent, oldIndex),
      description: `Move ${widget.widget_type}`,
      data: {
        widget,
        oldParent,
        newParent,
        oldIndex,
        newIndex
      }
    };
  }

  createBatchCommand(
    commands: Command[],
    description: string
  ): Command {
    return {
      id: `batch-${Date.now()}`,
      timestamp: new Date(),
      execute: () => {
        commands.forEach(cmd => cmd.execute());
      },
      undo: () => {
        // Undo in reverse order
        for (let i = commands.length - 1; i >= 0; i--) {
          commands[i].undo();
        }
      },
      description,
      data: { commands }
    };
  }

  // Batch multiple operations into a single undoable command
  beginBatch(): void {
    // Mark the start of a batch operation
    this.isExecutingCommand = true;
  }

  endBatch(description: string): void {
    // Mark the end of a batch operation
    this.isExecutingCommand = false;
    this.updateCanStates();
    this.notifyHistoryChanged();
  }

  // Get statistics about the history
  getStatistics(): {
    totalCommands: number;
    currentPosition: number;
    canUndo: boolean;
    canRedo: boolean;
    historySize: number;
    maxSize: number;
  } {
    return {
      totalCommands: this.history.length,
      currentPosition: this.currentIndex + 1,
      canUndo: this.currentIndex >= 0,
      canRedo: this.currentIndex < this.history.length - 1,
      historySize: this.history.length,
      maxSize: this.maxHistorySize
    };
  }

  // Set maximum history size
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      const excess = this.history.length - this.maxHistorySize;
      this.history = this.history.slice(excess);
      this.currentIndex = Math.max(-1, this.currentIndex - excess);
      this.updateCanStates();
      this.notifyHistoryChanged();
    }
  }

  // Check if currently executing a command (to prevent recursion)
  isExecuting(): boolean {
    return this.isExecutingCommand;
  }

  // Debug helper
  debugHistory(): void {
    console.group('Undo/Redo History');
    console.log('Current Index:', this.currentIndex);
    console.log('Can Undo:', this.currentIndex >= 0);
    console.log('Can Redo:', this.currentIndex < this.history.length - 1);
    console.log('History:');
    this.history.forEach((cmd, index) => {
      const marker = index === this.currentIndex ? '→' : ' ';
      const status = index <= this.currentIndex ? '✓' : '○';
      console.log(`${marker} [${index}] ${status} ${cmd.description} (${cmd.timestamp.toLocaleTimeString()})`);
    });
    console.groupEnd();
  }
}
