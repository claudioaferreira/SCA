import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionHumanaService } from '../../services/gestion-humana.service';

export interface AusenciaUI {
  idEmpleado: number;
  nombre: string;
  codigo: string;
  tipoId: number;
  tipo: string;
  fechaInicio: string;
  fechaReintegro: string;
  cantidadDias: number;
  estado: 'actual' | 'futuro' | 'pasado';
  etiqueta: string;
}

@Component({
  selector: 'app-ausencias-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ausencias-widget.component.html',
  styleUrl: './ausencias-widget.component.scss',
})
export class AusenciasWidgetComponent implements OnInit {

  ausencias: AusenciaUI[] = [];
  cargando = true;

  private ghService = inject(GestionHumanaService);

  get totalEnCurso(): number {
    return this.ausencias.filter(a => a.estado === 'actual').length;
  }

  get totalMes(): number {
    return this.ausencias.length;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.ghService.getAusenciasMes().subscribe({
      next: (res: any) => {
        this.ausencias = this.procesar(res.body ?? []);
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  inicial(nombre: string): string {
    return nombre?.trim()?.[0]?.toUpperCase() ?? '?';
  }

  iconoTipo(tipoId: number): string {
    switch (tipoId) {
      case 1: return '⏱️';   // Permiso
      case 2: return '🩺';   // Licencia
      case 4: return '🌴';   // Vacaciones
      case 5: return '⏰';   // Tardanza
      default: return '📋';
    }
  }

  claseTipo(tipoId: number): string {
    switch (tipoId) {
      case 1: return 'tipo-permiso';
      case 2: return 'tipo-licencia';
      case 4: return 'tipo-vacaciones';
      case 5: return 'tipo-tardanza';
      default: return '';
    }
  }

  private procesar(data: any[]): AusenciaUI[] {
    return data.map(a => ({
      idEmpleado:     a.IdEmpleado,
      nombre:         a.nombre,
      codigo:         a.codigo,
      tipoId:         a.IdTipoSolicitud,
      tipo:           a.TipoSolicitud,
      fechaInicio:    a.FechaInicio,
      fechaReintegro: a.FechaReintegro,
      cantidadDias:   a.CantidadDias,
      estado:         a.Estado,
      etiqueta:       this.generarEtiqueta(a.Estado, a.DiasParaCambio),
    }));
  }

  private generarEtiqueta(estado: string, diasParaCambio: number): string {
    if (estado === 'actual') {
      if (diasParaCambio === 0) return 'Vuelve hoy';
      if (diasParaCambio === 1) return 'Vuelve mañana';
      return `Vuelve en ${diasParaCambio}d`;
    }
    if (estado === 'futuro') {
      if (diasParaCambio === 0) return 'Inicia hoy';
      if (diasParaCambio === 1) return 'Inicia mañana';
      return `En ${diasParaCambio}d`;
    }
    if (estado === 'pasado') {
      if (diasParaCambio === 0) return 'Volvió hoy';
      return `Volvió hace ${diasParaCambio}d`;
    }
    return '';
  }
}