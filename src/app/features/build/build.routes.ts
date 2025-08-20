// src/app/features/build/build.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ConfigGuard } from '../../core/guards/config.guard';

export const BUILD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [ConfigGuard, AuthGuard],
    children: [
      {
        path: 'history/:appId',
        loadComponent: () => import('./build-history/build-history.component').then(m => m.BuildHistoryComponent),
        title: 'Build History - Flutter No-Code Builder',
        data: { animation: 'BuildHistoryPage' }
      },
      // {
      //   path: 'details/:buildId',
      //   loadComponent: () => import('./build-details/build-details.component').then(m => m.BuildDetailsComponent),
      //   title: 'Build Details - Flutter No-Code Builder',
      //   data: { animation: 'BuildDetailsPage' }
      // },
      // {
      //   path: 'logs/:buildId',
      //   loadComponent: () => import('./build-logs/build-logs.component').then(m => m.BuildLogsComponent),
      //   title: 'Build Logs - Flutter No-Code Builder',
      //   data: { animation: 'BuildLogsPage' }
      // },
      {
        path: 'start/:appId',
        loadComponent: () => import('./build-dialog/build-dialog.component').then(m => m.BuildDialogComponent),
        outlet: 'modal',
        title: 'Start Build - Flutter No-Code Builder'
      },
      // {
      //   path: 'config/:appId',
      //   loadComponent: () => import('./build-config/build-config.component').then(m => m.BuildConfigComponent),
      //   title: 'Build Configuration - Flutter No-Code Builder',
      //   data: { animation: 'BuildConfigPage' }
      // },
      // {
      //   path: 'artifacts/:buildId',
      //   loadComponent: () => import('./build-artifacts/build-artifacts.component').then(m => m.BuildArtifactsComponent),
      //   title: 'Build Artifacts - Flutter No-Code Builder',
      //   data: { animation: 'BuildArtifactsPage' }
      // },
      // {
      //   path: 'download/:buildId/:type',
      //   loadComponent: () => import('./download-manager/download-manager.component').then(m => m.DownloadManagerComponent),
      //   outlet: 'modal',
      //   title: 'Download Build - Flutter No-Code Builder'
      // },
      // {
      //   path: 'publish/:buildId',
      //   loadComponent: () => import('./publish-dialog/publish-dialog.component').then(m => m.PublishDialogComponent),
      //   outlet: 'modal',
      //   title: 'Publish App - Flutter No-Code Builder'
      // },
      // {
      //   path: 'certificates/:appId',
      //   loadComponent: () => import('./certificates/certificates.component').then(m => m.CertificatesComponent),
      //   title: 'Certificates & Signing - Flutter No-Code Builder',
      //   data: { animation: 'CertificatesPage' }
      // },
      // {
      //   path: 'environments/:appId',
      //   loadComponent: () => import('./build-environments/build-environments.component').then(m => m.BuildEnvironmentsComponent),
      //   title: 'Build Environments - Flutter No-Code Builder',
      //   data: { animation: 'EnvironmentsPage' }
      // },
      // {
      //   path: 'ci-cd/:appId',
      //   loadComponent: () => import('./ci-cd-config/ci-cd-config.component').then(m => m.CiCdConfigComponent),
      //   title: 'CI/CD Configuration - Flutter No-Code Builder',
      //   data: { animation: 'CiCdPage' }
      // },
      // {
      //   path: 'webhooks/:appId',
      //   loadComponent: () => import('./build-webhooks/build-webhooks.component').then(m => m.BuildWebhooksComponent),
      //   title: 'Build Webhooks - Flutter No-Code Builder',
      //   data: { animation: 'WebhooksPage' }
      // },
      // {
      //   path: 'monitor/:appId',
      //   loadComponent: () => import('./build-monitor/build-monitor.component').then(m => m.BuildMonitorComponent),
      //   title: 'Build Monitor - Flutter No-Code Builder',
      //   data: { animation: 'MonitorPage', realtime: true }
      // },
      // {
      //   path: 'queue',
      //   loadComponent: () => import('./build-queue/build-queue.component').then(m => m.BuildQueueComponent),
      //   title: 'Build Queue - Flutter No-Code Builder',
      //   data: { animation: 'QueuePage', realtime: true }
      // },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
