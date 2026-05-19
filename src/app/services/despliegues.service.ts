import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DesplieguesService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/despliegues`);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/despliegues/${id}`);
  }

  crear(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/despliegues`, payload);
  }

  actualizarRuta(idRuta: number, payload: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/despliegues/ruta/${idRuta}`, payload);
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/despliegues/${id}/estado`, { estado });
  }
  addRuta(idDespliegue: number, payload: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/despliegues/${idDespliegue}/ruta`, payload);
}

finalizar(id: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/despliegues/${id}/finalizar`, {});
}

eliminar(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/despliegues/${id}`);
}

actualizarEstadoCentro(idRutaCentro: number, estado: string | null): Observable<any> {
  return this.http.patch(`${this.apiUrl}/despliegues/centro/${idRutaCentro}/estado`, { estado });
}
}
