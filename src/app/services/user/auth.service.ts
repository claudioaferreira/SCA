import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { IUser } from '../../interfaces/user/user';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
   private apiUrl = environment.apiUrl;

  // Keys que ya usa tu app
  private readonly KEY_TOKEN = 'sca_token';
  private readonly KEY_REFRESH = 'sca_refresh_token';
  private readonly KEY_USER = 'sca_user';

  /** Usuario actual como signal (reactivo en templates con just {{ user() }}) */
  readonly user = signal<IUser | null>(this.leerUsuarioStorage());

  /** Atajos derivados */
  readonly nombre = computed(() => this.user()?.nombre ?? '');
  readonly username = computed(() => this.user()?.username ?? '');
  readonly empleadoId = computed(() => this.user()?.empleadoId ?? null);
  readonly rolId = computed(() => this.user()?.rol ?? null);
  readonly nombreRol = computed(() => this.mapearRol(this.rolId()));

  // ─── LECTURA / VERIFICACIÓN ───────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.KEY_TOKEN);
  }
  getRefreshToken(): string | null {
    return localStorage.getItem(this.KEY_REFRESH);
  }
  getUser(): IUser | null {
    return this.user();
  }
  getEmpleadoId(): number | null {
    return this.empleadoId();
  }
  getUserId(): number | null {
    return this.user()?.userId ?? null;
  }

   // PARA EL TEMPLATE: ¿Tiene alguno de estos roles? (ej: *ngIf="auth.hasRole(1,2)")
  hasRole(...roles: number[]): boolean {
  const rol = this.rolId();
  return rol != null && roles.includes(rol);
}

 // Atajos específicos por rol (ej: *ngIf="auth.isAdmin()")
  hasAnyRole(roles: number[]): boolean {
  const rol = this.rolId();
  return rol != null && roles.includes(rol);
}

isAdmin(): boolean {
  return this.rolId() === 1;
}

isSupervisor(): boolean {
  return this.rolId() === 2;
}

isConsulta(): boolean {
  return this.rolId() === 3;
}

isVacaciones(): boolean {
  return this.rolId() === 4;
}

  isLoggedIn(): boolean {
  // Mientras exista un token o un refresh token, consideramos que hay una sesión que se puede usar o restaurar
  return !!this.getToken() || !!this.getRefreshToken();
}

  // ─── ESCRITURA / LOGIN ────────────────────────────────────────────────
  /** Llámalo desde tu pantalla de login al recibir la respuesta del backend */
  guardarSesion(payload: {
    token: string;
    refreshToken: string;
    user: IUser;
  }): void {
    localStorage.setItem(this.KEY_TOKEN, payload.token);
    localStorage.setItem(this.KEY_REFRESH, payload.refreshToken);
    localStorage.setItem(this.KEY_USER, JSON.stringify(payload.user));
    this.user.set(payload.user);
  }

  logout(): void {
    localStorage.removeItem(this.KEY_TOKEN);
    localStorage.removeItem(this.KEY_REFRESH);
    localStorage.removeItem(this.KEY_USER);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────
  private leerUsuarioStorage(): IUser | null {
    try {
      const raw = localStorage.getItem(this.KEY_USER);
      return raw ? (JSON.parse(raw) as IUser) : null;
    } catch {
      return null;
    }
  }

  /** Ajusta este mapa a tus roles reales de la tabla Cat_Rol / Roles */
  private mapearRol(rolId: number | null): string {
    if (rolId == null) return '';
    const map: Record<number, string> = {
      1: 'Adm',
      2: 'Supervisor',
      3: 'Consulta',
      4: 'Vacaciones',
      // ...agrega los que tengas
    };
    return map[rolId] ?? `Rol ${rolId}`;
  }


  verificarPin(userId: number, pin: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/verify-pin`, { userId, pin });
}

// En tu auth.service.ts
refreshAccessToken(refreshToken: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/refresh`, { refreshToken });
}
}