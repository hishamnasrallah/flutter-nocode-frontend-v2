// src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationEvent
} from '@angular/animations';

export type DialogType = 'confirm' | 'delete' | 'warning' | 'info' | 'success' | 'error' | 'prompt';

export interface DialogConfig {
  title?: string;
  message: string;
  type?: DialogType;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValidator?: (value: string) => string | null;
  backdropClickDismiss?: boolean;
  escapeKeyDismiss?: boolean;
  autoFocus?: boolean;
  persistent?: boolean;
}

export interface DialogResult {
  confirmed: boolean;
  value?: any;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  @ViewChild('dialogElement', { static: false }) dialogElement!: ElementRef<HTMLDivElement>;
  @ViewChild('inputField', { static: false }) inputField!: ElementRef<HTMLInputElement>;

  @Input() title: string = '';
  @Input() message: string = '';
  @Input() type: DialogType = 'confirm';
  @Input() icon: string = '';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() showCancelButton: boolean = true;
  @Input() showInput: boolean = false;
  @Input() inputPlaceholder: string = 'Enter value...';
  @Input() inputValidator?: (value: string) => string | null;
  @Input() backdropClickDismiss: boolean = true;
  @Input() escapeKeyDismiss: boolean = true;
  @Input() autoFocus: boolean = true;
  @Input() persistent: boolean = false;
  @Input() hasExtraContent: boolean = false;

  @Output() confirm = new EventEmitter<DialogResult>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen: boolean = false;
  isProcessing: boolean = false;
  inputValue: string = '';
  inputError: string = '';
  dialogId: string = `dialog-${Math.random().toString(36).substr(2, 9)}`;

  private previousFocusElement: HTMLElement | null = null;
  private focusTrap: FocusTrap | null = null;

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  ngOnInit(): void {
    // Set default texts based on type
    this.setDefaultTexts();
  }

  ngOnDestroy(): void {
    this.cleanupFocusTrap();
    this.restoreFocus();
  }

  open(config?: DialogConfig): void {
    if (config) {
      this.applyConfig(config);
    }

    // Store current focus
    this.previousFocusElement = document.activeElement as HTMLElement;

    this.isOpen = true;
    this.isProcessing = false;
    this.inputValue = '';
    this.inputError = '';

    // Focus management
    setTimeout(() => {
      this.setupFocus();
    }, 100);
  }

  close(): void {
    this.isOpen = false;
    this.cleanupFocusTrap();
    this.restoreFocus();
    this.closed.emit();
  }

  onConfirm(): void {
    if (this.showInput && this.inputValidator) {
      const error = this.inputValidator(this.inputValue);
      if (error) {
        this.inputError = error;
        return;
      }
    }

    if (this.persistent) {
      this.isProcessing = true;
    }

    const result: DialogResult = {
      confirmed: true,
      value: this.showInput ? this.inputValue : undefined
    };

    this.confirm.emit(result);

    if (!this.persistent) {
      this.close();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.backdropClickDismiss && !this.isProcessing) {
      const target = event.target as HTMLElement;
      if (target.classList.contains('dialog-backdrop')) {
        this.onCancel();
      }
    }
  }

  onEscape(): void {
    if (this.escapeKeyDismiss && !this.isProcessing) {
      this.onCancel();
    }
  }

  canConfirm(): boolean {
    if (this.showInput && this.inputValidator) {
      return !this.inputValidator(this.inputValue);
    }
    return true;
  }

  getIcon(): string {
    if (this.icon) return this.icon;

    const iconMap: Record<DialogType, string> = {
      'confirm': 'help_outline',
      'delete': 'delete_forever',
      'warning': 'warning',
      'info': 'info',
      'success': 'check_circle',
      'error': 'error',
      'prompt': 'edit'
    };

    return iconMap[this.type] || 'help_outline';
  }

  getDefaultTitle(): string {
    const titleMap: Record<DialogType, string> = {
      'confirm': 'Confirm Action',
      'delete': 'Delete Confirmation',
      'warning': 'Warning',
      'info': 'Information',
      'success': 'Success',
      'error': 'Error',
      'prompt': 'Enter Value'
    };

    return titleMap[this.type] || 'Confirm';
  }

  setProcessing(processing: boolean): void {
    this.isProcessing = processing;
    this.cdr.detectChanges();
  }

  private applyConfig(config: DialogConfig): void {
    if (config.title !== undefined) this.title = config.title;
    if (config.message !== undefined) this.message = config.message;
    if (config.type !== undefined) this.type = config.type;
    if (config.icon !== undefined) this.icon = config.icon;
    if (config.confirmText !== undefined) this.confirmText = config.confirmText;
    if (config.cancelText !== undefined) this.cancelText = config.cancelText;
    if (config.showCancelButton !== undefined) this.showCancelButton = config.showCancelButton;
    if (config.showInput !== undefined) this.showInput = config.showInput;
    if (config.inputPlaceholder !== undefined) this.inputPlaceholder = config.inputPlaceholder;
    if (config.inputValidator !== undefined) this.inputValidator = config.inputValidator;
    if (config.backdropClickDismiss !== undefined) this.backdropClickDismiss = config.backdropClickDismiss;
    if (config.escapeKeyDismiss !== undefined) this.escapeKeyDismiss = config.escapeKeyDismiss;
    if (config.autoFocus !== undefined) this.autoFocus = config.autoFocus;
    if (config.persistent !== undefined) this.persistent = config.persistent;

    this.setDefaultTexts();
  }

  private setDefaultTexts(): void {
    if (!this.confirmText) {
      const confirmTextMap: Record<DialogType, string> = {
        'confirm': 'Confirm',
        'delete': 'Delete',
        'warning': 'Continue',
        'info': 'OK',
        'success': 'OK',
        'error': 'OK',
        'prompt': 'Submit'
      };
      this.confirmText = confirmTextMap[this.type] || 'Confirm';
    }

    if (!this.cancelText) {
      this.cancelText = this.type === 'info' || this.type === 'success' || this.type === 'error'
        ? 'Close'
        : 'Cancel';
    }
  }

  private setupFocus(): void {
    if (!this.autoFocus) return;

    if (this.showInput && this.inputField) {
      this.inputField.nativeElement.focus();
      this.inputField.nativeElement.select();
    } else if (this.dialogElement) {
      const confirmButton = this.dialogElement.nativeElement.querySelector('.dialog-btn-confirm') as HTMLElement;
      if (confirmButton) {
        confirmButton.focus();
      }
    }

    // Setup focus trap
    if (this.dialogElement) {
      this.focusTrap = new FocusTrap(this.dialogElement.nativeElement);
      this.focusTrap.activate();
    }
  }

  private cleanupFocusTrap(): void {
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }
  }

  private restoreFocus(): void {
    if (this.previousFocusElement && document.body.contains(this.previousFocusElement)) {
      this.previousFocusElement.focus();
      this.previousFocusElement = null;
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    if (event.key === 'Escape' && this.escapeKeyDismiss && !this.isProcessing) {
      event.preventDefault();
      this.onCancel();
    } else if (event.key === 'Enter' && !this.showInput && this.canConfirm() && !this.isProcessing) {
      event.preventDefault();
      this.onConfirm();
    }
  }
}

// Focus Trap utility class
class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  activate(): void {
    this.updateFocusableElements();
    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }

  private updateFocusableElements(): void {
    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.element.querySelectorAll(selector));
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }
}
