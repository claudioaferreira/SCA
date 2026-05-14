import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SolicitudListado } from '../interfaces/solicitud.interface';

@Injectable({
  providedIn: 'root',
})
export class GestionHumanaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/gestion-humana/solicitudes
   * Devuelve un Observable con la lista de solicitudes.
   *
   * El backend responde { error, status, message, body: [...] }
   * Por eso el tipo del Observable es `any`: lo desempaquetamos en el componente.
   */

  crearSolicitud(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/gestion-humana/solicitudes`, payload);
  }

  getSolicitudes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/solicitudes`);
  }

  // // Catálogos (los vamos a usar en el form más adelante, los dejo listos)
  // getTipos(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/gestion-humana/catalogos/tipos`);
  // }

  // getSubtiposPermiso(): Observable<any> {
  //   return this.http.get(
  //     `${this.apiUrl}/gestion-humana/catalogos/subtipos-permiso`,
  //   );
  // }

  // getSubtiposLicencia(): Observable<any> {
  //   return this.http.get(
  //     `${this.apiUrl}/gestion-humana/catalogos/subtipos-licencia`,
  //   );
  // }

  // getSubtiposIncidencia(): Observable<any> {
  //   return this.http.get(
  //     `${this.apiUrl}/gestion-humana/catalogos/subtipos-incidencia`,
  //   );
  // }

  // getEstados(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/gestion-humana/catalogos/estados`);
  // }

  // Otros endpoints (para futuras pantallas)
  getDisponibilidadHoy(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/disponibilidad/hoy`);
  }

  getCumpleanosHoy(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/cumpleanos/hoy`);
  }

  getSaldoVacaciones(idEmpleado: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gestion-humana/vacaciones/saldo/${idEmpleado}`,
    );
  }

  getAusenciasRango(inicio: string, fin: string): Observable<any> {
    // Usamos HttpParams para enviar los parámetros en la URL (?inicio=xxx&fin=xxx)
    // tal como los espera req.query en tu controlador de Express.
    const params = new HttpParams().set('inicio', inicio).set('fin', fin);

    return this.http.get(`${this.apiUrl}/gestion-humana/ausencias/rango`, {
      params,
    });
  }

  // Saldos de vacaciones
  getSaldos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/saldos`);
  }

  actualizarSaldo(
    idEmpleado: number,
    anio: number,
    payload: any,
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/gestion-humana/saldos/${idEmpleado}/${anio}`,
      payload,
    );
  }

  cerrarAnoVacaciones(anioSaliente: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/gestion-humana/saldos/cerrar-anio`, {
      anioSaliente,
    });
  }

  verificarAnioCerrado(anio: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gestion-humana/saldos/anio-cerrado/${anio}`,
    );
  }

  getAusenciasMes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/ausencias/mes`);
  }

  getSaldoHistoricoEmpleado(idEmpleado: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gestion-humana/saldos/historico/${idEmpleado}`,
    );
  }

  getAniosDisponiblesEmpleado(idEmpleado: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gestion-humana/saldos/anios-disponibles/${idEmpleado}`,
    );
  }

  getSaldosPorVencer(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/saldos/por-vencer`);
  }

  getDisponibilidadAhora(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-humana/disponibilidad`);
  }

  bloquearEmpleado(payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/gestion-humana/disponibilidad/bloquear`,
      payload,
    );
  }

  liberarEmpleado(idEstadoManual: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/gestion-humana/disponibilidad/liberar/${idEstadoManual}`,
      {},
    );
  }

  getBloqueosManualesRango(inicio: string, fin: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/gestion-humana/bloqueos/rango?inicio=${inicio}&fin=${fin}`,
    );
  }
}
