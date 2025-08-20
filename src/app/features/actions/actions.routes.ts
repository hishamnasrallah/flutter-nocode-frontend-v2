// src/app/features/actions/actions.routes.ts

import { Routes } from '@angular/router';

export const ACTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./action-list/action-list.component')
      .then(m => m.ActionListComponent),
    title: 'Actions'
  },
  {
    path: 'new',
    loadComponent: () => import('./action-editor/action-editor.component')
      .then(m => m.ActionEditorComponent),
    title: 'Create Action'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./action-editor/action-editor.component')
      .then(m => m.ActionEditorComponent),
    title: 'Edit Action'
  }
];
