import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import AuthService from '../services/auth.service';

export const verificacionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si hay un token de verificación pendiente, redirigir a la página de verificación
  if (authService.hasVerificationPending()) {
    return router.parseUrl('/verify-whatsapp');
  }

  // Si no hay verificación pendiente, permitir la navegación
  return true;
};

export const requireVerificacionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay un token de verificación pendiente, redirigir a la página principal
  if (!authService.hasVerificationPending()) {
    return router.parseUrl('/');
  }

  // Si hay verificación pendiente, permitir la navegación a la página de verificación
  return true;
};
