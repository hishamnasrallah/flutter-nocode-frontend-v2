// src/app/features/dashboard/create-project-dialog/create-project-dialog.component.ts

import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Application, CreateApplicationRequest } from '../../../core/models/application.model';
import { ThemeService } from '../../../core/services/theme.service';
import { Theme, CreateThemeRequest } from '../../../core/models/theme.model';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-project-dialog.component.html',
  styleUrls: ['./create-project-dialog.component.scss']
})
export class CreateProjectDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Application>();

  projectForm: FormGroup;
  isCreating = false;
  availableThemes: Theme[] = [];
  templates = [
    { id: 'blank', name: 'Blank', icon: 'add_box', selected: true },
    { id: 'ecommerce', name: 'E-Commerce', icon: 'shopping_cart', selected: false },
    { id: 'social', name: 'Social Media', icon: 'people', selected: false },
    { id: 'blog', name: 'Blog', icon: 'article', selected: false }
  ];

  constructor(
    private fb: FormBuilder,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    this.projectForm = this.fb.group({
      // Basic project fields
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      package_name: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)]],
      template: ['blank'],

      // Theme selection
      themeOption: ['existing'], // 'existing' or 'new'
      selectedThemeId: [null], // For existing theme selection

      // New theme fields
      newThemeName: [''],
      newPrimaryColor: ['#2196F3'],
      newAccentColor: ['#FF4081'],
      newBackgroundColor: ['#FFFFFF'],
      newTextColor: ['#212121'],
      newFontFamily: ['Roboto'],
      newIsDarkMode: [false]
    });
  }

  ngOnInit(): void {
    // Auto-generate package name based on project name
    this.projectForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.projectForm.get('package_name')?.dirty) {
        const packageName = this.generatePackageName(name);
        this.projectForm.patchValue({ package_name: packageName }, { emitEvent: false });
      }
    });

    // Load available themes
    this.loadThemes();

    // Set initial validators
    this.updateValidators();
  }

  loadThemes(): void {
    this.themeService.getThemes().subscribe({
      next: (response) => {
        this.availableThemes = response.results;

        // If no themes exist, force user to create a new one
        if (this.availableThemes.length === 0) {
          this.projectForm.patchValue({ themeOption: 'new' });
          this.updateValidators();
          this.notificationService.info('No themes available. Please create one.');
        } else {
          // Set default theme
          const defaultTheme = this.availableThemes.find(t => t.name === 'Material Blue') || this.availableThemes[0];
          this.projectForm.patchValue({ selectedThemeId: defaultTheme.id });
        }
      },
      error: (err) => {
        console.error('Failed to load themes:', err);
        // Force new theme creation on error
        this.projectForm.patchValue({ themeOption: 'new' });
        this.updateValidators();
      }
    });
  }

  onThemeOptionChange(): void {
    this.updateValidators();
  }

  updateValidators(): void {
    const themeOption = this.projectForm.get('themeOption')?.value;

    if (themeOption === 'existing') {
      // Clear new theme validators
      this.projectForm.get('selectedThemeId')?.setValidators([Validators.required]);
      this.projectForm.get('newThemeName')?.clearValidators();
      this.projectForm.get('newPrimaryColor')?.clearValidators();
      this.projectForm.get('newAccentColor')?.clearValidators();
      this.projectForm.get('newBackgroundColor')?.clearValidators();
      this.projectForm.get('newTextColor')?.clearValidators();
      this.projectForm.get('newFontFamily')?.clearValidators();
    } else {
      // Set new theme validators
      this.projectForm.get('selectedThemeId')?.clearValidators();
      this.projectForm.get('newThemeName')?.setValidators([Validators.required, Validators.minLength(3)]);
      this.projectForm.get('newPrimaryColor')?.setValidators([Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]);
      this.projectForm.get('newAccentColor')?.setValidators([Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]);
      this.projectForm.get('newBackgroundColor')?.setValidators([Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]);
      this.projectForm.get('newTextColor')?.setValidators([Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]);
      this.projectForm.get('newFontFamily')?.setValidators([Validators.required]);
    }

    // Update validity
    Object.keys(this.projectForm.controls).forEach(key => {
      this.projectForm.get(key)?.updateValueAndValidity();
    });
  }

  getSelectedTheme(): Theme | undefined {
    const selectedId = this.projectForm.get('selectedThemeId')?.value;
    return this.availableThemes.find(t => t.id === Number(selectedId));
  }

  getDescriptionLength(): number {
    const description = this.projectForm.get('description')?.value;
    return (description && typeof description === 'string') ? description.length : 0;
  }

  selectTemplate(templateId: string): void {
    this.templates.forEach(t => t.selected = t.id === templateId);
    this.projectForm.patchValue({ template: templateId });
  }

  generatePackageName(name: string): string {
    const cleaned = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    return `com.example.${cleaned || 'app'}`;
  }

  onClose(): void {
    this.close.emit();
  }

  isFormValid(): boolean {
    const themeOption = this.projectForm.get('themeOption')?.value;

    // Check base fields - use !! to convert to boolean
    const baseFieldsValid =
      !!this.projectForm.get('name')?.valid &&
      !!this.projectForm.get('package_name')?.valid;

    // Check theme fields based on selection
    if (themeOption === 'existing') {
      return baseFieldsValid && !!this.projectForm.get('selectedThemeId')?.value;
    } else {
      return baseFieldsValid &&
        !!this.projectForm.get('newThemeName')?.valid &&
        !!this.projectForm.get('newPrimaryColor')?.valid &&
        !!this.projectForm.get('newAccentColor')?.valid &&
        !!this.projectForm.get('newBackgroundColor')?.valid &&
        !!this.projectForm.get('newTextColor')?.valid &&
        !!this.projectForm.get('newFontFamily')?.valid;
    }
  }

  async onCreate(): Promise<void> {
    if (!this.isFormValid()) {
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isCreating = true;

    try {
      const formValue = this.projectForm.value;
      let themeId: number;

      // Handle theme creation or selection
      if (formValue.themeOption === 'new') {
        // Create new theme first
        const newThemeRequest: CreateThemeRequest = {
          name: formValue.newThemeName,
          primary_color: formValue.newPrimaryColor,
          accent_color: formValue.newAccentColor,
          background_color: formValue.newBackgroundColor,
          text_color: formValue.newTextColor,
          font_family: formValue.newFontFamily,
          is_dark_mode: formValue.newIsDarkMode
        };

        try {
          const createdTheme = await this.themeService.createTheme(newThemeRequest).toPromise();
          if (!createdTheme) {
            throw new Error('Failed to create theme');
          }
          themeId = createdTheme.id;
          this.notificationService.success(`Theme "${createdTheme.name}" created successfully!`);
        } catch (themeError: any) {
          console.error('Failed to create theme:', themeError);
          this.notificationService.error('Failed to create theme. Please try again.');
          this.isCreating = false;
          return;
        }
      } else {
        // Use existing theme
        themeId = Number(formValue.selectedThemeId);
      }

      // Create the application with the theme ID
      const createData: CreateApplicationRequest = {
        name: formValue.name,
        description: formValue.description || '',
        package_name: formValue.package_name,
        version: '1.0.0',
        theme_id: themeId  // Changed from 'theme' to 'theme_id' to match backend expectation
      };

      const application = await this.applicationService.createApplication(createData).toPromise();

      if (application) {
        this.notificationService.success(`Project "${application.name}" created successfully!`);
        this.created.emit(application);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);

      if (error.error?.field_errors) {
        const fieldErrors = error.error.field_errors;

        if (fieldErrors.name) {
          this.projectForm.get('name')?.setErrors({
            serverError: fieldErrors.name[0]
          });
        }

        if (fieldErrors.package_name) {
          this.projectForm.get('package_name')?.setErrors({
            serverError: fieldErrors.package_name[0]
          });
        }

        this.notificationService.error('Please correct the errors in the form');
      } else {
        this.notificationService.error(error.message || 'Failed to create project');
      }
    } finally {
      this.isCreating = false;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be no more than ${maxLength} characters`;
    }

    if (field?.hasError('pattern')) {
      if (fieldName === 'package_name') {
        return 'Package name must be in format: com.example.appname';
      }
      if (fieldName.includes('Color')) {
        return 'Color must be in hex format: #RRGGBB';
      }
    }

    if (field?.hasError('serverError')) {
      return field.errors?.['serverError'];
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Project Name',
      'description': 'Description',
      'package_name': 'Package Name',
      'selectedThemeId': 'Theme',
      'newThemeName': 'Theme Name',
      'newPrimaryColor': 'Primary Color',
      'newAccentColor': 'Accent Color',
      'newBackgroundColor': 'Background Color',
      'newTextColor': 'Text Color',
      'newFontFamily': 'Font Family'
    };

    return labels[fieldName] || fieldName;
  }
}
