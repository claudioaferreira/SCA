import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from '../interfaces/asignacion.interface';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getEmpleados(): Observable<Empleado[]> {
     return this.http.get<Empleado[]>(`${this.apiUrl}/empleados`);
  }

  guardarAsignacionCelda(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignaciones/guardar-celda`, payload);
  }
  getAsignacionesSemana(inicio: string, fin: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignaciones/semana`, {
      params: { inicio, fin }
    });
  }
  actualizarEstadoAsignacion(idAsignacion: number, idEstado: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/asignaciones/estado`, {
      idAsignacion,
      idEstado
    });
  }

   eliminarAsignacion(idAsignacion: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/asignaciones/${idAsignacion}`);
  }
}
