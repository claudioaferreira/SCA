import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  // Aquí guardaremos quiénes están en ruta
  // Formato: { "idEmpleado-fecha": true }
  tecnicosOcupados: any = {};

  // Función para marcar como ocupado o libre
  marcarEstado(idEmpleado: number, fecha: string, estaEnRuta: boolean) {
    const key = `${idEmpleado}-${fecha}`;
    this.tecnicosOcupados[key] = estaEnRuta;
  }

  // Función para consultar si alguien puede trabajar
  estaDisponible(idEmpleado: number, fecha: string): boolean {
    const key = `${idEmpleado}-${fecha}`;
    // Si no está en el objeto o es false, está disponible
    return !this.tecnicosOcupados[key];
  }
}