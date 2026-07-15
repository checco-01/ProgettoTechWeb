import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'game',
    canActivate: [authGuard],
    // Quando creerai GameComponent, sostituisci con:
    // loadComponent: () => import('./pages/game/game').then(m => m.GameComponent),
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
