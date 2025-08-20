// src/app/features/builder/builder.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ConfigGuard } from '../../core/guards/config.guard';
// import { CanDeactivateGuard } from '../../core/guards/can-deactivate.guard';

export const BUILDER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [ConfigGuard, AuthGuard],
    children: [
      {
        path: ':appId',
        loadComponent: () => import('./builder/builder.component').then(m => m.BuilderComponent),
        canActivate: [ConfigGuard],
        title: 'App Builder - Flutter No-Code Builder',
        children: [
          {
            path: 'screen/:screenId',
            loadComponent: () => import('./builder/builder.component').then(m => m.BuilderComponent),
            data: { mode: 'screen' }
          },
          // {
          //   path: 'widget/:widgetId',
          //   loadComponent: () => import('./widget-editor/widget-editor.component').then(m => m.WidgetEditorComponent),
          //   data: { mode: 'widget' }
          // },
          {
            path: 'properties',
            loadComponent: () => import('./properties-panel/properties-panel.component').then(m => m.PropertiesPanelComponent),
            outlet: 'sidebar',
            data: { panel: 'properties' }
          },
          {
            path: 'tree',
            loadComponent: () => import('./widget-tree/widget-tree.component').then(m => m.WidgetTreeComponent),
            outlet: 'sidebar',
            data: { panel: 'tree' }
          }
        ]
      },
      {
        path: ':appId/preview',
        loadComponent: () => import('./preview/preview.component').then(m => m.PreviewComponent),
        title: 'Preview - Flutter No-Code Builder',
        data: { fullscreen: true }
      },
      {
        path: ':appId/preview/:screenId',
        loadComponent: () => import('./preview/preview.component').then(m => m.PreviewComponent),
        title: 'Preview Screen - Flutter No-Code Builder',
        data: { fullscreen: true }
      },
      // {
      //   path: ':appId/code-view',
      //   loadComponent: () => import('./code-view/code-view.component').then(m => m.CodeViewComponent),
      //   title: 'Code View - Flutter No-Code Builder',
      //   data: { readonly: true }
      // },
      {
        path: ':appId/screens',
        loadComponent: () => import('./screen-manager/screen-manager.component').then(m => m.ScreenManagerComponent),
        outlet: 'modal',
        title: 'Manage Screens - Flutter No-Code Builder'
      },
      {
        path: ':appId/widgets',
        loadComponent: () => import('./widget-panel/widget-panel.component').then(m => m.WidgetPanelComponent),
        outlet: 'sidebar',
        data: { panel: 'widgets' }
      },
      // {
      //   path: ':appId/settings',
      //   loadComponent: () => import('./app-settings/app-settings.component').then(m => m.AppSettingsComponent),
      //   outlet: 'modal',
      //   title: 'App Settings - Flutter No-Code Builder'
      // },
      // {
      //   path: ':appId/export',
      //   loadComponent: () => import('./export-dialog/export-dialog.component').then(m => m.ExportDialogComponent),
      //   outlet: 'modal',
      //   title: 'Export Project - Flutter No-Code Builder'
      // },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
