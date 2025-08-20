// src/app/features/data-sources/data-sources.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ConfigGuard } from '../../core/guards/config.guard';

export const dataSourcesRoutes: Routes = [
  {
    path: '',
    canActivate: [ConfigGuard, AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./data-source-list/data-source-list.component')
          .then(m => m.DataSourceListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./data-source-editor/data-source-editor.component')
          .then(m => m.DataSourceEditorComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./data-source-editor/data-source-editor.component')
          .then(m => m.DataSourceEditorComponent)
      },
      {
        path: ':id/fields',
        loadComponent: () => import('./data-source-editor/data-source-editor.component')
          .then(m => m.DataSourceEditorComponent)
      }
    ]
  }
];
