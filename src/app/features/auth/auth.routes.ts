// src/app/features/auth/auth.routes.ts

import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
        title: 'Login - Flutter No-Code Builder'
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
        title: 'Register - Flutter No-Code Builder'
      },
      // {
      //   path: 'forgot-password',
      //   loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
      //   title: 'Forgot Password - Flutter No-Code Builder'
      // },
      // {
      //   path: 'reset-password/:token',
      //   loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
      //   title: 'Reset Password - Flutter No-Code Builder'
      // },
      // {
      //   path: 'verify-email/:token',
      //   loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
      //   title: 'Verify Email - Flutter No-Code Builder'
      // },
      // {
      //   path: 'two-factor',
      //   loadComponent: () => import('./two-factor/two-factor.component').then(m => m.TwoFactorComponent),
      //   title: 'Two-Factor Authentication - Flutter No-Code Builder'
      // },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
