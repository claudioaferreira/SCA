import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermisosService {

  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** Todos los permisos del catálogo (para mostrar los checkboxes en la UI) */
  getTodos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/permisos`);
  }

  /** IDs de permisos que tiene un rol (para saber cuáles checkboxes marcar) */
  getDelRol(IdRol: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/permisos/rol/${IdRol}`);
  }

  /** Marcar checkbox → asignar permiso al rol */
  asignar(IdRol: number, IdPermiso: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/permisos/rol/${IdRol}/${IdPermiso}`, {});
  }

  /** Desmarcar checkbox → quitar permiso del rol */
  quitar(IdRol: number, IdPermiso: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/permisos/rol/${IdRol}/${IdPermiso}`);
  }

  crearPermiso(permiso: { clave: string, descripcion: string, modulo: string }) {
    return this.http.post<{ IdPermiso: number, message: string }>(`${this.apiUrl}/permisos`, permiso);
  }
}
