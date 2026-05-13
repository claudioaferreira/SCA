import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { BdayApiResponse, CumpleaneroAPI } from '../interfaces/bdayPersona';

@Injectable({
  providedIn: 'root'
})
export class BdayPersonaService {
  private apiUrl = environment.apiUrl;



  constructor(private http: HttpClient) { }


    /**
   * Llama al endpoint /cumpleanos/semana y enriquece la respuesta con
   * personas de ayer, semana y los próximos días de la semana.
   *
   * El endpoint solo devuelve "semana", así que generamos los grupos
   * de la semana calculando las fechas y filtrando por día/mes.
   */

getCumpleanosSemana(): Observable<BdayApiResponse[]> {
    return this.http.get<BdayApiResponse[]>(`${this.apiUrl}/gestion-humana/cumpleanos/semana`);
  }

  crearSolicitud(payload: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/gestion-humana/solicitudes`, payload);
}

}
