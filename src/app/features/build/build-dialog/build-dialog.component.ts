// src/app/features/build/build-dialog/build-dialog.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { BuildService } from '../../../core/services/build.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Application } from '../../../core/models/application.model';
import { BuildHistory, BuildStatus, BuildOptions, BuildLogEntry, BuildProgressUpdate } from '../../../core/models/build.model';

interface BuildRequirement {
  label: string;
  description: string;
  met: boolean;
}

@Component({
  selector: 'app-build-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './build-dialog.component.html',
  styleUrls: ['./build-dialog.component.scss']
})
export class BuildDialogComponent implements OnInit, OnDestroy {
  @ViewChild('logContent') logContent!: ElementRef<HTMLDivElement>;

  @Input() application!: Application;
  @Output() close = new EventEmitter<void>();
  @Output() buildStarted = new EventEmitter<BuildHistory>();
  @Output() buildCompleted = new EventEmitter<BuildHistory>();

  private destroy$ = new Subject<void>();

  buildForm: FormGroup;
  isBuilding = false;
  buildStatus: BuildStatus | null = null;
  buildProgress = 0;
  currentStatusMessage = '';
  buildStartTime: Date | null = null;
  buildEndTime: Date | null = null;
  currentBuild: BuildHistory | null = null;
  showAdvancedOptions = false;
  showBuildLog = false;
  logExpanded = false;
  buildLogEntries: BuildLogEntry[] = [];
  iosAvailable = false;

  buildRequirements: BuildRequirement[] = [
    {
      label: 'Application has screens',
      description: 'At least one screen is required',
      met: false
    },
    {
      label: 'Home screen configured',
      description: 'A home screen must be set',
      met: false
    },
    {
      label: 'Package name valid',
      description: 'Valid Android package name format',
      met: false
    },
    {
      label: 'Version configured',
      description: 'Version name and code are set',
      met: false
    }
  ];

  private buildTimer: any;

  constructor(
    private fb: FormBuilder,
    private buildService: BuildService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {
    this.buildForm = this.fb.group({
      buildType: ['debug', Validators.required],
      platform: ['android', Validators.required],
      versionName: ['1.0.0', [Validators.required, Validators.pattern(/^\d+\.\d+\.\d+$/)]],
      versionCode: [1, [Validators.required, Validators.min(1)]],
      cleanBuild: [false],
      obfuscate: [false],
      splitPerAbi: [false],
      minSdk: [21, [Validators.min(16), Validators.max(33)]],
      targetSdk: [33, [Validators.min(16), Validators.max(34)]]
    });
  }

  ngOnInit(): void {
    this.validateBuildRequirements();
    this.setupWebSocketListeners();

    // Auto-populate version from application
    if (this.application) {
      const versionParts = this.application.version.split('.');
      const versionCode = parseInt(versionParts[versionParts.length - 1]) || 1;

      this.buildForm.patchValue({
        versionName: this.application.version,
        versionCode: versionCode
      });
    }

    // Watch for build type changes
    this.buildForm.get('buildType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(buildType => {
        if (buildType === 'debug') {
          this.buildForm.patchValue({ obfuscate: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.buildTimer) {
      clearInterval(this.buildTimer);
    }

    // Disconnect WebSocket if building
    if (this.isBuilding && this.application) {
      this.webSocketService.disconnect();
    }
  }

  private validateBuildRequirements(): void {
    if (!this.application) return;

    // Check screens
    this.buildRequirements[0].met = (this.application.screens_count || 0) > 0;

    // Check home screen
    this.buildRequirements[1].met = this.application.screens?.some(s => s.is_home_screen) || false;

    // Validate package name
    const packageNameRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
    this.buildRequirements[2].met = packageNameRegex.test(this.application.package_name);

    // Check version
    this.buildRequirements[3].met = !!this.application.version;
  }

  private setupWebSocketListeners(): void {
    // Listen for build progress updates
    this.webSocketService.onBuildProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: any) => {
        this.handleBuildProgress(update.data);
      });
  }

  private handleBuildProgress(update: BuildProgressUpdate): void {
    this.buildStatus = update.status;
    this.buildProgress = update.progress;
    this.currentStatusMessage = update.message;

    // Add to log
    this.addLogEntry({
      timestamp: update.timestamp,
      level: this.getLogLevelForStatus(update.status),
      message: update.message
    });

    // Handle completion
    if (update.status === 'success' || update.status === 'failed') {
      this.buildEndTime = new Date();
      this.isBuilding = false;

      if (this.buildTimer) {
        clearInterval(this.buildTimer);
      }

      if (update.status === 'success') {
        this.notificationService.success('Build completed successfully!');
        this.buildCompleted.emit(this.currentBuild!);
      } else {
        this.notificationService.error('Build failed. Check the logs for details.');
      }
    }

    // Auto-scroll log
    this.scrollLogToBottom();
  }

  private getLogLevelForStatus(status: BuildStatus): 'info' | 'warning' | 'error' | 'debug' {
    switch (status) {
      case 'failed':
      case 'code_generation_failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'info';
    }
  }

  selectPlatform(platform: string): void {
    if (platform === 'ios' && !this.iosAvailable) {
      return;
    }
    this.buildForm.patchValue({ platform });
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  canStartBuild(): boolean {
    return this.buildRequirements.every(req => req.met);
  }

  getEstimatedBuildTime(): string {
    const formValue = this.buildForm.value;
    let minutes = 2; // Base time

    if (formValue.buildType === 'release') {
      minutes += 3;
    }

    if (formValue.cleanBuild) {
      minutes += 2;
    }

    if (formValue.obfuscate) {
      minutes += 1;
    }

    if (formValue.platform === 'both') {
      minutes *= 2;
    }

    return `${minutes}-${minutes + 2} minutes`;
  }

  async startBuild(): Promise<void> {
    if (this.buildForm.invalid || !this.canStartBuild()) {
      return;
    }

    this.isBuilding = true;
    this.buildStatus = 'started';
    this.buildProgress = 0;
    this.currentStatusMessage = 'Initializing build process...';
    this.buildStartTime = new Date();
    this.buildLogEntries = [];
    this.showBuildLog = true;

    // Connect WebSocket
    this.webSocketService.connect(this.application.id);

    // Prepare build options
    const formValue = this.buildForm.value;
    const buildOptions: BuildOptions = {
      buildType: formValue.buildType,
      platform: formValue.platform,
      cleanBuild: formValue.cleanBuild,
      obfuscate: formValue.obfuscate,
      splitPerAbi: formValue.splitPerAbi,
      targetSdk: formValue.targetSdk,
      minSdk: formValue.minSdk
    };

    // Add initial log entries
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Starting ${formValue.buildType} build for ${formValue.platform}...`
    });

    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Build configuration: ${JSON.stringify(buildOptions, null, 2)}`
    });

    // Start build timer
    this.buildTimer = interval(1000).subscribe(() => {
      // Update build duration display
    });

    try {
      const build = await this.buildService.startBuild(this.application.id, buildOptions).toPromise();

      if (build) {
        this.currentBuild = build;
        this.buildStarted.emit(build);

        this.addLogEntry({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Build ID: ${build.build_id}`
        });

        // Simulate progress for demo (in production, real progress comes from WebSocket)
        this.simulateBuildProgress();
      }
    } catch (error: any) {
      console.error('Failed to start build:', error);
      this.buildStatus = 'failed';
      this.isBuilding = false;

      this.addLogEntry({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: error.message || 'Failed to start build'
      });

      this.notificationService.error('Failed to start build');
    }
  }

  private simulateBuildProgress(): void {
    // This is for demo purposes - real progress comes from WebSocket
    const steps = [
      { progress: 10, status: 'generating_code' as BuildStatus, message: 'Generating Flutter code...' },
      { progress: 25, status: 'generating_code' as BuildStatus, message: 'Creating widget tree...' },
      { progress: 40, status: 'code_generated' as BuildStatus, message: 'Code generation complete' },
      { progress: 50, status: 'building_apk' as BuildStatus, message: 'Building APK...' },
      { progress: 65, status: 'building_apk' as BuildStatus, message: 'Compiling resources...' },
      { progress: 80, status: 'building_apk' as BuildStatus, message: 'Optimizing APK...' },
      { progress: 95, status: 'building_apk' as BuildStatus, message: 'Finalizing build...' },
      { progress: 100, status: 'success' as BuildStatus, message: 'Build completed successfully!' }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        this.handleBuildProgress({
          build_id: this.currentBuild?.build_id || '',
          status: step.status,
          progress: step.progress,
          message: step.message,
          timestamp: new Date().toISOString()
        });
        stepIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 3000);
  }

  async cancelBuild(): Promise<void> {
    if (!this.currentBuild) return;

    const confirmed = confirm('Are you sure you want to cancel the build?');
    if (!confirmed) return;

    try {
      await this.buildService.cancelBuild(this.currentBuild.id).toPromise();

      this.buildStatus = 'cancelled';
      this.isBuilding = false;
      this.buildEndTime = new Date();

      this.addLogEntry({
        timestamp: new Date().toISOString(),
        level: 'warning',
        message: 'Build cancelled by user'
      });

      this.notificationService.warning('Build cancelled');

      if (this.buildTimer) {
        clearInterval(this.buildTimer);
      }
    } catch (error) {
      console.error('Failed to cancel build:', error);
      this.notificationService.error('Failed to cancel build');
    }
  }

  toggleLogExpanded(): void {
    this.logExpanded = !this.logExpanded;
  }

  private addLogEntry(entry: BuildLogEntry): void {
    this.buildLogEntries.push(entry);

    // Limit log entries
    if (this.buildLogEntries.length > 1000) {
      this.buildLogEntries.shift();
    }
  }

  private scrollLogToBottom(): void {
    if (this.logContent) {
      setTimeout(() => {
        const element = this.logContent.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }

  formatBuildDuration(): string {
    if (!this.buildStartTime) return '0s';

    const endTime = this.buildEndTime || new Date();
    const durationMs = endTime.getTime() - this.buildStartTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  formatLogTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  getStatusClass(): string {
    switch (this.buildStatus) {
      case 'building':
      case 'generating_code':
      case 'building_apk':
        return 'building';
      case 'success':
        return 'success';
      case 'failed':
      case 'code_generation_failed':
        return 'failed';
      default:
        return '';
    }
  }

  getStatusTitle(): string {
    switch (this.buildStatus) {
      case 'started':
        return 'Starting Build...';
      case 'generating_code':
        return 'Generating Code...';
      case 'code_generated':
        return 'Code Generated';
      case 'building_apk':
        return 'Building APK...';
      case 'success':
        return 'Build Successful!';
      case 'failed':
        return 'Build Failed';
      case 'cancelled':
        return 'Build Cancelled';
      default:
        return 'Building...';
    }
  }

  async downloadApk(): Promise<void> {
    if (!this.currentBuild) return;

    try {
      const blob = await this.buildService.downloadApk(this.currentBuild.id).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.application.name}-${this.buildForm.value.versionName}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.notificationService.success('APK download started');
      }
    } catch (error) {
      console.error('Failed to download APK:', error);
      this.notificationService.error('Failed to download APK');
    }
  }

  async downloadSourceCode(): Promise<void> {
    if (!this.currentBuild) return;

    try {
      const blob = await this.buildService.downloadSourceCode(this.currentBuild.id).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.application.name}-source.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.notificationService.success('Source code download started');
      }
    } catch (error) {
      console.error('Failed to download source code:', error);
      this.notificationService.error('Failed to download source code');
    }
  }

  viewInHistory(): void {
    this.onClose();
    // Navigate to build history (handled by parent component)
  }

  startNewBuild(): void {
    this.isBuilding = false;
    this.buildStatus = null;
    this.buildProgress = 0;
    this.currentBuild = null;
    this.buildStartTime = null;
    this.buildEndTime = null;
    this.buildLogEntries = [];
    this.showBuildLog = false;
  }

  onClose(): void {
    if (this.isBuilding && this.buildStatus === 'building') {
      const confirmed = confirm('A build is in progress. Are you sure you want to close?');
      if (!confirmed) return;
    }

    this.close.emit();
  }
}
