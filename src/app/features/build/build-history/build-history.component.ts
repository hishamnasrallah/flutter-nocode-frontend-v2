// src/app/features/build/build-history/build-history.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { BuildService } from '../../../core/services/build.service';
import { ApplicationService } from '../../../core/services/application.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BuildDialogComponent } from '../build-dialog/build-dialog.component';
import { Application } from '../../../core/models/application.model';
import { BuildHistory, BuildStatus } from '../../../core/models/build.model';

interface BuildStats {
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
}

@Component({
  selector: 'app-build-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BuildDialogComponent],
  templateUrl: './build-history.component.html',
  styleUrls: ['./build-history.component.scss']
})
export class BuildHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  application: Application | null = null;
  builds: BuildHistory[] = [];
  filteredBuilds: BuildHistory[] = [];
  activeBuilds: BuildHistory[] = [];
  isLoading = true;
  hasMore = false;
  currentPage = 1;
  pageSize = 20;

  // Filters
  filterStatus = '';
  filterPlatform = '';
  filterBuildType = '';

  // UI State
  expandedBuildId: number | null = null;
  showBuildDialog = false;
  showLogModal = false;
  selectedBuild: BuildHistory | null = null;
  selectedBuildLogs = '';

  // Stats
  stats: BuildStats = {
    total: 0,
    successful: 0,
    failed: 0,
    inProgress: 0
  };

  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private buildService: BuildService,
    private applicationService: ApplicationService,
    private webSocketService: WebSocketService,
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

    // Setup auto-refresh for active builds
    this.setupAutoRefresh();

    // Setup WebSocket listeners
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Disconnect WebSocket
    this.webSocketService.disconnect();
  }

  private loadApplication(appId: number): void {
    this.applicationService.getApplication(appId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (app) => {
          this.application = app;
          this.loadBuildHistory();

          // Connect WebSocket for real-time updates
          this.webSocketService.connect(appId);
        },
        error: (error) => {
          console.error('Failed to load application:', error);
          this.notificationService.error('Failed to load application');
          this.router.navigate(['/dashboard']);
        }
      });
  }

  private loadBuildHistory(): void {
    if (!this.application) return;

    this.isLoading = true;

    this.buildService.getBuildHistory(this.application.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.builds = response.results;
          this.hasMore = !!response.next;
          this.applyFilter();
          this.updateStats();
          this.identifyActiveBuilds();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load build history:', error);
          this.notificationService.error('Failed to load build history');
          this.isLoading = false;
        }
      });
  }

  private setupAutoRefresh(): void {
    // Refresh active builds every 5 seconds
    this.refreshInterval = interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeBuilds.length > 0) {
          this.refreshActiveBuilds();
        }
      });
  }

  private setupWebSocketListeners(): void {
    // Listen for build updates
    this.webSocketService.onBuildProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: any) => {
        this.handleBuildUpdate(update.data);
      });
  }

  private handleBuildUpdate(update: any): void {
    // Find and update the build
    const buildIndex = this.builds.findIndex(b => b.build_id === update.build_id);
    if (buildIndex >= 0) {
      this.builds[buildIndex] = {
        ...this.builds[buildIndex],
        status: update.status
      };

      this.applyFilter();
      this.updateStats();
      this.identifyActiveBuilds();

      // Show notification for completion
      if (update.status === 'success' || update.status === 'failed') {
        const message = update.status === 'success'
          ? 'Build completed successfully!'
          : 'Build failed';

        this.notificationService[update.status === 'success' ? 'success' : 'error'](message);
      }
    }
  }

  private refreshActiveBuilds(): void {
    this.activeBuilds.forEach(build => {
      this.buildService.getBuildDetails(build.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedBuild) => {
            const index = this.builds.findIndex(b => b.id === build.id);
            if (index >= 0) {
              this.builds[index] = updatedBuild;
              this.applyFilter();
              this.updateStats();
              this.identifyActiveBuilds();
            }
          }
        });
    });
  }

  private identifyActiveBuilds(): void {
    const activeStatuses: BuildStatus[] = [
      'started', 'generating_code', 'building_apk', 'queued', 'uploading', 'processing'
    ];

    this.activeBuilds = this.builds.filter(b =>
      activeStatuses.includes(b.status)
    );
  }

  private updateStats(): void {
    this.stats = {
      total: this.builds.length,
      successful: this.builds.filter(b => b.status === 'success').length,
      failed: this.builds.filter(b => b.status === 'failed' || b.status === 'code_generation_failed').length,
      inProgress: this.activeBuilds.length
    };
  }

  applyFilter(): void {
    let filtered = [...this.builds];

    if (this.filterStatus) {
      filtered = filtered.filter(b => b.status === this.filterStatus);
    }

    if (this.filterPlatform) {
      filtered = filtered.filter(b => b.platform === this.filterPlatform);
    }

    if (this.filterBuildType) {
      filtered = filtered.filter(b => b.build_type === this.filterBuildType);
    }

    // Sort by start time descending
    filtered.sort((a, b) =>
      new Date(b.build_start_time).getTime() - new Date(a.build_start_time).getTime()
    );

    this.filteredBuilds = filtered;
  }

  refreshHistory(): void {
    this.loadBuildHistory();
  }

  loadMore(): void {
    // Implementation for pagination
    this.currentPage++;
    // Load more builds...
  }

  toggleExpanded(buildId: number): void {
    this.expandedBuildId = this.expandedBuildId === buildId ? null : buildId;
  }

  async cancelBuild(build: BuildHistory): Promise<void> {
    const confirmed = confirm('Are you sure you want to cancel this build?');
    if (!confirmed) return;

    try {
      await this.buildService.cancelBuild(build.id).toPromise();

      build.status = 'cancelled';
      this.applyFilter();
      this.updateStats();
      this.identifyActiveBuilds();

      this.notificationService.warning('Build cancelled');
    } catch (error) {
      console.error('Failed to cancel build:', error);
      this.notificationService.error('Failed to cancel build');
    }
  }

  async downloadApk(build: BuildHistory, event?: MouseEvent): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    try {
      const blob = await this.buildService.downloadApk(build.id).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.application?.name}-${build.id}.apk`;
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

  async downloadSource(build: BuildHistory, event?: MouseEvent): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    try {
      const blob = await this.buildService.downloadSourceCode(build.id).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.application?.name}-source-${build.id}.zip`;
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

  async viewLogs(build: BuildHistory, event?: MouseEvent): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    this.selectedBuild = build;
    this.selectedBuildLogs = 'Loading logs...';
    this.showLogModal = true;

    try {
      const logs = await this.buildService.getBuildLogs(build.id).toPromise();
      this.selectedBuildLogs = logs || 'No logs available';
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.selectedBuildLogs = 'Failed to load logs';
    }
  }

  closeLogModal(): void {
    this.showLogModal = false;
    this.selectedBuild = null;
    this.selectedBuildLogs = '';
  }

  copyLogs(): void {
    navigator.clipboard.writeText(this.selectedBuildLogs);
    this.notificationService.success('Logs copied to clipboard');
  }

  downloadLogs(): void {
    const blob = new Blob([this.selectedBuildLogs], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-${this.selectedBuild?.id}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  startNewBuild(): void {
    this.showBuildDialog = true;
  }

  closeBuildDialog(): void {
    this.showBuildDialog = false;
  }

  onBuildStarted(build: BuildHistory): void {
    this.builds.unshift(build);
    this.applyFilter();
    this.updateStats();
    this.identifyActiveBuilds();
  }

  onBuildCompleted(build: BuildHistory): void {
    const index = this.builds.findIndex(b => b.id === build.id);
    if (index >= 0) {
      this.builds[index] = build;
      this.applyFilter();
      this.updateStats();
      this.identifyActiveBuilds();
    }
  }

  goBack(): void {
    if (this.application) {
      this.router.navigate(['/builder', this.application.id]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Utility methods
  getStatusClass(status: BuildStatus): string {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
      case 'code_generation_failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'started':
      case 'generating_code':
      case 'building_apk':
      case 'queued':
      case 'uploading':
      case 'processing':
        return 'building';
      default:
        return '';
    }
  }

  getStatusIcon(status: BuildStatus): string {
    return this.buildService.getBuildStatusIcon(status);
  }

  getStatusLabel(status: BuildStatus): string {
    const labels: Record<BuildStatus, string> = {
      'started': 'Started',
      'generating_code': 'Generating Code',
      'code_generated': 'Code Generated',
      'code_generation_failed': 'Generation Failed',
      'building_apk': 'Building APK',
      'success': 'Successful',
      'failed': 'Failed',
      'cancelled': 'Cancelled',
      'queued': 'Queued',
      'uploading': 'Uploading',
      'processing': 'Processing'
    };
    return labels[status] || status;
  }

  getStatusMessage(build: BuildHistory): string {
    const messages: Record<BuildStatus, string> = {
      'started': 'Initializing build process...',
      'generating_code': 'Generating Flutter code...',
      'code_generated': 'Code generation complete',
      'building_apk': 'Building APK file...',
      'queued': 'Build queued, waiting to start...',
      'uploading': 'Uploading build artifacts...',
      'processing': 'Processing build...',
      'success': 'Build completed successfully',
      'failed': 'Build failed',
      'cancelled': 'Build was cancelled',
      'code_generation_failed': 'Failed to generate code'
    };
    return messages[build.status] || 'Processing...';
  }

  getBuildProgress(build: BuildHistory): number {
    const progressMap: Record<BuildStatus, number> = {
      'started': 10,
      'generating_code': 30,
      'code_generated': 50,
      'building_apk': 70,
      'uploading': 90,
      'processing': 95,
      'success': 100,
      'failed': 0,
      'cancelled': 0,
      'code_generation_failed': 0,
      'queued': 5
    };
    return progressMap[build.status] || 0;
  }

  getPlatformIcon(platform?: string): string {
    switch (platform) {
      case 'android':
        return 'android';
      case 'ios':
        return 'phone_iphone';
      case 'both':
        return 'devices';
      default:
        return 'smartphone';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatDuration(build: BuildHistory): string {
    if (!build.build_start_time) return '0s';

    const start = new Date(build.build_start_time);
    const end = build.build_end_time ? new Date(build.build_end_time) : new Date();
    const durationMs = end.getTime() - start.getTime();

    return this.formatDurationMs(durationMs);
  }

  formatDurationSeconds(seconds?: number): string {
    if (!seconds) return '0s';
    return this.buildService.formatBuildDuration(seconds);
  }

  private formatDurationMs(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getEmptyMessage(): string {
    if (this.filterStatus || this.filterPlatform || this.filterBuildType) {
      return 'No builds match your filters. Try adjusting your filter criteria.';
    }
    return 'You haven\'t created any builds yet. Start your first build to see it here.';
  }

  trackByBuildId(index: number, build: BuildHistory): number {
    return build.id;
  }
}
