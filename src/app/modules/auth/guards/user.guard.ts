import { Router, type CanActivateFn } from '@angular/router';
import AuthService from '../services/auth.service';
import { inject } from '@angular/core';
import { map, Observable, of, switchMap, take, timer } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const authUserGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si hay un usuario autenticado redirigir a /
  if (authService.isAuthenticatedUser()) {
    return router.parseUrl('/');
  }

  return true;
};

export const authenticatedUserGuard: CanActivateFn = (route, state): Observable<boolean | any> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convertimos el signal isAuthenticated a un Observable
  const isAuthenticated$ = toObservable(authService.isAuthenticated);

  return isAuthenticated$.pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        return of(true);
      }

      return timer(300).pipe(
        switchMap(() => {
          if (authService.isAuthenticated()) {
            return of(true);
          }
          return of(router.parseUrl('/'));
        })
      );
    })
  );
};
