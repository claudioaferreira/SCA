import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ILoginRequest } from '../../interfaces/user/user';
import { ILoginResponseToken } from '../../interfaces/user/loginResponseToken';
import { EmpleadoSinUsuario, Rol, UsuarioListado } from '../../interfaces/asignacion.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── AUTH ─────────────────────────────────────────────────────
  login(credentials: ILoginRequest): Observable<ILoginResponseToken> {
    return this.http.post<ILoginResponseToken>(`${this.apiUrl}/auth/login`, credentials);
  }

  changePassword(newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/change-password`, { newPassword });
  }

  // ── HELPERS JWT ──────────────────────────────────────────────
  estaLogueado(): boolean {
    const token = localStorage.getItem('sca_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  obtenerCampoJWT(campo: string): string {
    const token = localStorage.getItem('sca_token');
    if (!token) return '';
    try {
      return JSON.parse(atob(token.split('.')[1]))[campo] ?? '';
    } catch {
      return '';
    }
  }

  // ── USUARIOS ─────────────────────────────────────────────────
  obtenerUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  obtenerUsuarioById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/roles`);
  }

  getEmpleadosSinUsuario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/sin-usuario`);
  }

  createUser(payload: { email: string; IdRol: number; IdEmpleado: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/newuser`, payload);
  }

  toggleActive(id: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}/estado`, { isActive });
  }
}