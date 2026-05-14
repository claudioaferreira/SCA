import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../app/services/user/auth.service';

export const roleGuard = (roles: number[]): CanActivateFn => {
  return () => {

    const auth = inject(AuthService);
    const router = inject(Router);

    // No logueado
    if (!auth.isLoggedIn()) {

      Swal.fire({
        icon: 'warning',
        title: 'Sesión expirada',
        text: 'Debes iniciar sesión.',
        confirmButtonText: 'Aceptar'
      });

      router.navigate(['/login']);
      return false;
    }

    // Sin permisos
    if (!auth.hasAnyRole(roles)) {

      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'No tienes permisos para acceder a este módulo.',
        confirmButtonText: 'Aceptar'
      });

      router.navigate(['/home']);
      return false;
    }

    return true;
  };
};