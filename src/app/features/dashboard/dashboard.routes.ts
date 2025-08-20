// src/app/features/dashboard/dashboard.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ConfigGuard } from '../../core/guards/config.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [ConfigGuard, AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - Flutter No-Code Builder',
        data: { animation: 'DashboardPage' }
      },
      // {
      //   path: 'projects',
      //   loadComponent: () => import('./project-list/project-list.component').then(m => m.ProjectListComponent),
      //   title: 'My Projects - Flutter No-Code Builder',
      //   data: { animation: 'ProjectsPage' }
      // },
      // {
      //   path: 'templates',
      //   loadComponent: () => import('./template-gallery/template-gallery.component').then(m => m.TemplateGalleryComponent),
      //   title: 'Templates - Flutter No-Code Builder',
      //   data: { animation: 'TemplatesPage' }
      // },
      // {
      //   path: 'recent',
      //   loadComponent: () => import('./recent-projects/recent-projects.component').then(m => m.RecentProjectsComponent),
      //   title: 'Recent Projects - Flutter No-Code Builder',
      //   data: { animation: 'RecentPage' }
      // },
      // {
      //   path: 'shared',
      //   loadComponent: () => import('./shared-projects/shared-projects.component').then(m => m.SharedProjectsComponent),
      //   title: 'Shared with Me - Flutter No-Code Builder',
      //   data: { animation: 'SharedPage' }
      // },
      // {
      //   path: 'trash',
      //   loadComponent: () => import('./trash/trash.component').then(m => m.TrashComponent),
      //   title: 'Trash - Flutter No-Code Builder',
      //   data: { animation: 'TrashPage' }
      // },
      {
        path: 'create',
        loadComponent: () => import('./create-project-dialog/create-project-dialog.component').then(m => m.CreateProjectDialogComponent),
        outlet: 'modal',
        title: 'Create New Project - Flutter No-Code Builder'
      },
      // {
      //   path: 'import',
      //   loadComponent: () => import('./import-project/import-project.component').then(m => m.ImportProjectComponent),
      //   outlet: 'modal',
      //   title: 'Import Project - Flutter No-Code Builder'
      // },
      // {
      //   path: 'project/:id',
      //   loadComponent: () => import('./project-details/project-details.component').then(m => m.ProjectDetailsComponent),
      //   title: 'Project Details - Flutter No-Code Builder',
      //   data: { animation: 'ProjectDetailsPage' }
      // },
      // {
      //   path: 'project/:id/settings',
      //   loadComponent: () => import('./project-settings/project-settings.component').then(m => m.ProjectSettingsComponent),
      //   title: 'Project Settings - Flutter No-Code Builder'
      // },
      // {
      //   path: 'project/:id/collaborators',
      //   loadComponent: () => import('./project-collaborators/project-collaborators.component').then(m => m.ProjectCollaboratorsComponent),
      //   title: 'Project Collaborators - Flutter No-Code Builder'
      // },
      // {
      //   path: 'profile',
      //   loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent),
      //   title: 'Profile - Flutter No-Code Builder',
      //   data: { animation: 'ProfilePage' }
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./user-settings/user-settings.component').then(m => m.UserSettingsComponent),
      //   title: 'Settings - Flutter No-Code Builder',
      //   data: { animation: 'SettingsPage' }
      // },
      // {
      //   path: 'help',
      //   loadComponent: () => import('./help-center/help-center.component').then(m => m.HelpCenterComponent),
      //   title: 'Help Center - Flutter No-Code Builder',
      //   data: { animation: 'HelpPage' }
      // }
    ]
  }
];
