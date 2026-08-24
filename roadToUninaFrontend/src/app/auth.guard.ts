import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Durante l'SSR il cookie di sessione non è disponibile: si lascia passare
  // e sarà il client a verificare la sessione con /me.
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  return authService
    .checkSession()
    .pipe(map((loggedIn) => (loggedIn ? true : router.parseUrl('/?auth=login'))));
};
