import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth-page/auth-page').then((m) => m.AuthPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth-page/auth-page').then((m) => m.AuthPageComponent),
  },
  {
    path: 'game',
    canActivate: [authGuard],
    // Quando creerai GameComponent, sostituisci con:
    // loadComponent: () => import('./pages/game/game').then(m => m.GameComponent),
    loadComponent: () =>
      import('./pages/auth-page/auth-page').then((m) => m.AuthPageComponent),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
