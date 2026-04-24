import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from '../interfaces/asignacion.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getEmpleadosActivos(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/empleados/activos`);
  }
  
getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/empleados`);
  }
  guardarEmpleado(payload: any): Observable<any> {
    // console.log('Payload enviado al backend: desde services', payload);
   return this.http.post(`${this.apiUrl}/empleados/guardar`, payload);
   
  }

  guardarAsignacionCelda(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignaciones/guardar-celda`, payload);
  }

  getAsignacionesSemana(inicio: string, fin: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignaciones/semana`, {
      params: { inicio, fin }
    });
  }
  getDepartamentos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleados/departamentos/catalogo`);
  }

  getCargos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleados/cargos/catalogo`);
  }



  // ← nuevo: historial acumulado sin filtro de fecha
  getHistorialEmpleados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignaciones/historial`);
  }

  actualizarEstadoAsignacion(idAsignacion: number, idEstado: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/asignaciones/estado`, { idAsignacion, idEstado });
  }

  eliminarAsignacion(idAsignacion: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/asignaciones/${idAsignacion}`);
  }

  getCatalogoEquipos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/empleados/equipos/catalogo`);
  }
}