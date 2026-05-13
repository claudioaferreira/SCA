import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const token = localStorage.getItem('sca_token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {

    // validar formato JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.clear();
      router.navigate(['/login']);
      return false;
    }

    // leer payload
    const payload = JSON.parse(atob(tokenParts[1]));
    // validar expiración
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      localStorage.clear();
      router.navigate(['/login']);
      return false;
    }

    return true;
  } catch (error) {
    localStorage.clear();
    router.navigate(['/login']);
    return false;
  }
};