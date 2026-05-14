import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogosService {
  private apiUrl = `${environment.apiUrl}/catalogos`;

  constructor(private http: HttpClient) {}

  // --- Perfil / Empleados ---
  getEquipos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/equipos`);
  }

  getDepartamentos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/departamentos`);
  }
  getCargos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cargos`);
  }

  // --- RRHH / Gestión Humana ---
  getTiposSolicitud(): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/tipos`);
  }
  getEstadosSolicitud(): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/estados`);
  }
  
  getSubtiposPermiso(): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/subtipos-permiso`);
  }
  getSubtiposLicencia(): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/subtipos-licencia`);
  }
  getSubtiposIncidencia(): Observable<any> {
    return this.http.get(`${this.apiUrl}/solicitudes/subtipos-incidencia`);
  }

  // --- Asignaciones ---
  getTiposAsignacion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignaciones/tipos`);
  }
  getZonasGeo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/zonas-geograficas`);
  }
  getCentrosCedulacion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/centros-cedulacion`);
  }
}