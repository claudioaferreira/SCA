import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/user/auth.service';

/**
 * Guard que protege rutas verificando un permiso específico.
 *
 * ANTES usabas:   canActivate: [authGuard, roleGuard([1, 2])]
 * AHORA usarás:   canActivate: [authGuard, permisoGuard('asignaciones.ver')]
 *
 * Iremos migrando las rutas una a una en la Fase 4.
 */
export const permisoGuard = (clave: string): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: 'Debes iniciar sesión.',
        confirmButtonText: 'Aceptar',
      });
      router.navigate(['/login']);
      return false;
    }

    if (!auth.hasPermiso(clave)) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes permiso para acceder a este módulo.',
        confirmButtonText: 'Aceptar',
      });
      router.navigate(['/home']);
      return false;
    }

    return true;
  };
};
