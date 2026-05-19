import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/user/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // NO llamar auth.logout() aquí — eso dispara otra navegación a /login
  // creando un loop. Solo redirigimos limpiamente.
  return router.createUrlTree(['/login']);
};