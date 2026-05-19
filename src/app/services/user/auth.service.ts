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
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private readonly KEY_TOKEN   = 'sca_token';
  private readonly KEY_REFRESH = 'sca_refresh_token';
  private readonly KEY_USER    = 'sca_user';

  readonly user = signal<IUser | null>(this.leerUsuarioStorage());

  // ── Atajos derivados (signals) ────────────────────────────────────────
  readonly nombre     = computed(() => this.user()?.nombre    ?? '');
  readonly username   = computed(() => this.user()?.username  ?? '');
  readonly empleadoId = computed(() => this.user()?.empleadoId ?? null);
  readonly rolId      = computed(() => this.user()?.rol        ?? null);

  // Antes: venía de un mapa hardcodeado. Ahora viene de la BD directamente.
  readonly nombreRol  = computed(() => this.user()?.nombreRol ?? '');

  // Lista de claves de permiso del usuario logueado
  readonly permisos   = computed(() => this.user()?.permisos  ?? []);

  // ── Verificación de PERMISOS (el nuevo sistema) ───────────────────────

  /**
   * Pregunta: ¿tiene el usuario este permiso específico?
   *
   * En el template usa la directiva:  *hasPermiso="'asignaciones.ver'"
   * En el componente (TypeScript):    if (this.auth.hasPermiso('usuarios.crear'))
   */
  hasPermiso(clave: string): boolean {
    return this.permisos().includes(clave);
  }

  // ── Verificación de ROLES (se mantiene para no romper código existente) ─
  // Iremos reemplazando estos usos poco a poco en Fases 4 y 5.

  hasRole(...roles: number[]): boolean {
    const rol = this.rolId();
    return rol != null && roles.includes(rol);
  }

  hasAnyRole(roles: number[]): boolean {
    const rol = this.rolId();
    return rol != null && roles.includes(rol);
  }

  isAdmin():      boolean { return this.rolId() === 1; }
  isSupervisor(): boolean { return this.rolId() === 2; }
  isConsulta():   boolean { return this.rolId() === 3; }
  isVacaciones(): boolean { return this.rolId() === 4; }

  // ── Sesión ────────────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return !!this.getToken() || !!this.getRefreshToken();
  }

  getToken():        string | null { return localStorage.getItem(this.KEY_TOKEN);   }
  getRefreshToken(): string | null { return localStorage.getItem(this.KEY_REFRESH); }
  getUser():         IUser | null  { return this.user(); }
  getEmpleadoId():   number | null { return this.empleadoId(); }
  getUserId():       number | null { return this.user()?.userId ?? null; }

  guardarSesion(payload: { token: string; refreshToken: string; user: IUser }): void {
    localStorage.setItem(this.KEY_TOKEN,   payload.token);
    localStorage.setItem(this.KEY_REFRESH, payload.refreshToken);
    localStorage.setItem(this.KEY_USER,    JSON.stringify(payload.user));
    this.user.set(payload.user);
  }

  logout(): void {
    localStorage.removeItem(this.KEY_TOKEN);
    localStorage.removeItem(this.KEY_REFRESH);
    localStorage.removeItem(this.KEY_USER);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  verificarPin(userId: number, pin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-pin`, { userId, pin });
  }

  refreshAccessToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/refresh`, { refreshToken });
  }

  // ── Helper privado ────────────────────────────────────────────────────
  private leerUsuarioStorage(): IUser | null {
    try {
      const raw = localStorage.getItem(this.KEY_USER);
      return raw ? (JSON.parse(raw) as IUser) : null;
    } catch {
      return null;
    }
  }
}
