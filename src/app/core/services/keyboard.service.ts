// src/app/core/services/keyboard.service.ts

import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private shortcuts = new Map<string, () => void>();
  private enabled = true;

  constructor() {
    this.initializeGlobalShortcuts();
  }

  private initializeGlobalShortcuts(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(filter(e => !this.isInputElement(e.target as HTMLElement)))
      .subscribe(event => {
        if (!this.enabled) return;

        const key = this.getShortcutKey(event);
        const handler = this.shortcuts.get(key);

        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler();
        }
      });
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const parts = [];

    // Use metaKey for Mac, ctrlKey for others
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
      parts.push('ctrl');
    }

    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    // Normalize key name
    let key = event.key.toLowerCase();

    // Handle special keys
    switch (key) {
      case ' ':
        key = 'space';
        break;
      case 'arrowup':
        key = 'up';
        break;
      case 'arrowdown':
        key = 'down';
        break;
      case 'arrowleft':
        key = 'left';
        break;
      case 'arrowright':
        key = 'right';
        break;
      case 'escape':
        key = 'esc';
        break;
      case 'delete':
        key = 'delete';
        break;
      case 'backspace':
        key = 'backspace';
        break;
      case '+':
        key = '='; // Handle plus key
        break;
      case '-':
        key = '-';
        break;
    }

    parts.push(key);

    return parts.join('+');
  }

  private isInputElement(element: HTMLElement): boolean {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' ||
           tagName === 'textarea' ||
           tagName === 'select' ||
           element.contentEditable === 'true';
  }

  registerShortcut(key: string, handler: () => void): void {
    this.shortcuts.set(key.toLowerCase(), handler);
  }

  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key.toLowerCase());
  }

  // Pre-defined shortcuts
  registerDefaultShortcuts(handlers: {
    save?: () => void;
    undo?: () => void;
    redo?: () => void;
    delete?: () => void;
    copy?: () => void;
    paste?: () => void;
    cut?: () => void;
    duplicate?: () => void;
    preview?: () => void;
    build?: () => void;
    selectAll?: () => void;
    find?: () => void;
    replace?: () => void;
  }): void {
    if (handlers.save) this.registerShortcut('ctrl+s', handlers.save);
    if (handlers.undo) this.registerShortcut('ctrl+z', handlers.undo);
    if (handlers.redo) {
      this.registerShortcut('ctrl+y', handlers.redo);
      this.registerShortcut('ctrl+shift+z', handlers.redo);
    }
    if (handlers.delete) {
      this.registerShortcut('delete', handlers.delete);
      this.registerShortcut('backspace', handlers.delete);
    }
    if (handlers.copy) this.registerShortcut('ctrl+c', handlers.copy);
    if (handlers.paste) this.registerShortcut('ctrl+v', handlers.paste);
    if (handlers.cut) this.registerShortcut('ctrl+x', handlers.cut);
    if (handlers.duplicate) this.registerShortcut('ctrl+d', handlers.duplicate);
    if (handlers.preview) this.registerShortcut('ctrl+shift+p', handlers.preview);
    if (handlers.build) this.registerShortcut('ctrl+b', handlers.build);
    if (handlers.selectAll) this.registerShortcut('ctrl+a', handlers.selectAll);
    if (handlers.find) this.registerShortcut('ctrl+f', handlers.find);
    if (handlers.replace) this.registerShortcut('ctrl+h', handlers.replace);
  }

  // Enable/disable all shortcuts
  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Clear all shortcuts
  clearAll(): void {
    this.shortcuts.clear();
  }

  // Get all registered shortcuts
  getRegisteredShortcuts(): Map<string, () => void> {
    return new Map(this.shortcuts);
  }

  // Check if a shortcut is registered
  hasShortcut(key: string): boolean {
    return this.shortcuts.has(key.toLowerCase());
  }

  // Get human-readable shortcut description
  getShortcutDescription(key: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    let description = key;

    if (isMac) {
      description = description
        .replace(/ctrl/gi, '⌘')
        .replace(/alt/gi, '⌥')
        .replace(/shift/gi, '⇧')
        .replace(/\+/g, '');
    } else {
      description = description
        .replace(/ctrl/gi, 'Ctrl')
        .replace(/alt/gi, 'Alt')
        .replace(/shift/gi, 'Shift')
        .replace(/\+/g, '+');
    }

    return description;
  }

  // Get all shortcuts with descriptions
  getAllShortcuts(): Array<{ key: string; description: string }> {
    const shortcuts: Array<{ key: string; description: string }> = [
      { key: 'ctrl+s', description: 'Save' },
      { key: 'ctrl+z', description: 'Undo' },
      { key: 'ctrl+y', description: 'Redo' },
      { key: 'ctrl+shift+z', description: 'Redo' },
      { key: 'delete', description: 'Delete selected' },
      { key: 'backspace', description: 'Delete selected' },
      { key: 'ctrl+c', description: 'Copy' },
      { key: 'ctrl+v', description: 'Paste' },
      { key: 'ctrl+x', description: 'Cut' },
      { key: 'ctrl+d', description: 'Duplicate' },
      { key: 'ctrl+shift+p', description: 'Preview' },
      { key: 'ctrl+b', description: 'Build' },
      { key: 'ctrl+a', description: 'Select all' },
      { key: 'ctrl+f', description: 'Find' },
      { key: 'ctrl+h', description: 'Replace' },
      { key: 'ctrl+=', description: 'Zoom in' },
      { key: 'ctrl+-', description: 'Zoom out' },
      { key: 'ctrl+0', description: 'Reset zoom' },
      { key: 'esc', description: 'Deselect' }
    ];

    return shortcuts.map(s => ({
      key: this.getShortcutDescription(s.key),
      description: s.description
    }));
  }
}
