import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/user/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Evitar meter el token viejo si vamos a la ruta de refresh
  const esRutaRefresh = req.url.includes('/auth/refresh');

  const token = esRutaRefresh 
    ? null 
    : (authService.getToken() ?? sessionStorage.getItem('sca_token_cambio'));

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 2. Escuchar la respuesta del backend
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Si da 401 y NO es la petición de refresco, intentamos renovar
      if (error.status === 401 && !esRutaRefresh) {
        const refreshTokenVal = authService.getRefreshToken();

        if (refreshTokenVal) {
          console.warn('⚠️ [Interceptor] Access Token expirado. Intentando renovar sesión bajo cuerda...');
          return authService.refreshAccessToken(refreshTokenVal).pipe(
            switchMap((res: any) => {
              //console.log('✅ [Interceptor] Sesión renovada con éxito. Reintentando petición original con nuevo token.');
              // Guardamos el nuevo token de acceso de 2 horas
              localStorage.setItem('sca_token', res.token);

              // Clonamos la petición original con el nuevo token
              const nuevaPeticion = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.token}`
                }
              });

              // Reejecutamos la petición original
              return next(nuevaPeticion);
            }),
            catchError((errRefresh) => {
              //console.error('❌ [Interceptor] El Refresh Token también falló en el servicio.');
              // Si el refresh falla aquí, limpiamos y mandamos al Login de una vez
              authService.logout(); 
              return throwError(() => errRefresh);
            })
          );
        }
      }

      // CRUCIAL: Si el 401 vino de la propia ruta /auth/refresh, rompemos el bucle
      if (error.status === 401 && esRutaRefresh) {
        console.error('⛔ El Refresh Token falló en el servidor. Rompiendo bucle y forzando logout.');
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};