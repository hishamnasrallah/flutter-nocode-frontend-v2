// src/app/features/themes/themes.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ConfigGuard } from '../../core/guards/config.guard';

export const THEMES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [ConfigGuard, AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./theme-list/theme-list.component')
          .then(m => m.ThemeListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./theme-editor/theme-editor.component')
          .then(m => m.ThemeEditorComponent)
      }
    ]
  }
];
