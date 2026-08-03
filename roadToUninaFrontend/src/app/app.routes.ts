import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    redirectTo: '/?auth=login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: '/?auth=register',
    pathMatch: 'full',
  },
  {
    path: 'game',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/game').then((m) => m.GameComponent),
  },
  { path: '**', redirectTo: '/' },
];
