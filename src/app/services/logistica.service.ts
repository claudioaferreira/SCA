import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LogisticaService {
  // Guardaremos rangos. Ejemplo: { 92: { inicio: '2026-04-13', fin: '2026-04-20', motivo: 'Ruta' } }
  bloqueos: any = {};

  // Método para bloquear un técnico por un rango de fechas
  bloquearTecnico(id: number, inicio: string, fin: string) {
    this.bloqueos[id] = { inicio, fin };
  }

  // Método que consultarán ambos componentes
  estaBloqueado(id: number, fechaConsulta: Date): boolean {
    const registro = this.bloqueos[id];
    if (!registro) return false;

    const fecha = new Date(fechaConsulta).getTime();
    const inicio = new Date(registro.inicio).getTime();
    const fin = new Date(registro.fin).getTime();

    return fecha >= inicio && fecha <= fin;
  }
}