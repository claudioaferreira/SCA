import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { GestionHumanaService } from '../../../services/gestion-humana.service';
import { SolicitudListado }     from '../../../interfaces/solicitud.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.scss'
})
export class SolicitudesComponent implements  OnInit  {

  // ── ESTADO DE LA PANTALLA ─────────────────────────────────────
  loading = false;
  solicitudes: SolicitudListado[] = [];

  // Filtros locales
  filtroTexto      = '';
  filtroIdTipo     = 0;     // 0 = todos
  filtroIdEstado   = 0;



  // ── INYECCIÓN DE SERVICIOS ───────────────────────────────────
  private ghService = inject(GestionHumanaService);
  private router = inject(Router);

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // ── NAVEGACIÓN ──────────────────────────────────────────────
  irANuevaSolicitud(): void {
  this.router.navigate(['/gestion-humana/solicitudes/nueva']);
}

 // ── CARGAR DATOS ──────────────────────────────────────────────

 cargarSolicitudes(): void {
  this.loading = true;
  this.ghService.getSolicitudes().subscribe({
    next: (res) => {
      this.solicitudes = res.body ?? [];
      this.loading = false;
    },
    error: (err) => {
      console.error('Error al cargar solicitudes:', err);
      this.loading = false;
    },
  })
 }


  // ── FILTROS (corre en memoria, sin tocar el backend) ──────────
solicitudesFiltradas(): SolicitudListado[] {
    const texto = this.filtroTexto.toLowerCase().trim();

    return this.solicitudes.filter(s => {
      const coincideTexto =
        !texto ||
        s.Empleado.toLowerCase().includes(texto) ||
        s.CodigoEmpleado.includes(texto);

      const coincideTipo   = !this.filtroIdTipo   || s.IdTipoSolicitud   === this.filtroIdTipo;
      const coincideEstado = !this.filtroIdEstado || s.IdEstadoSolicitud === this.filtroIdEstado;

      return coincideTexto && coincideTipo && coincideEstado;
    });
  }
  
   limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroIdTipo = 0;
    this.filtroIdEstado = 0;
  }

  // ── HELPERS PARA EL TEMPLATE ──────────────────────────────────

  /** Devuelve "Tipo · Subtipo" o sólo "Tipo" si no hay subtipo */
  getTipoCompleto(s: SolicitudListado): string {
    const sub = s.SubtipoPermiso
             ?? s.SubtipoLicencia
             ?? s.SubtipoIncidencia
             ?? s.SubtipoPermisoHora;
    return sub ? `${s.TipoSolicitud} · ${sub}` : s.TipoSolicitud;
  }

  /** Devuelve el período según el tipo: rango, fecha+hora, etc. */
  getPeriodo(s: SolicitudListado): string {
    if (s.FechaInicio && s.FechaReintegro) {
      // Convertir la fecha de reintegro (YYYY-MM-DD) a objeto Date
      const partesFin = s.FechaReintegro.split('-');
      if (partesFin.length === 3) {
        const fechaFinAusencia = new Date(Number(partesFin[0]), Number(partesFin[1]) - 1, Number(partesFin[2]));
        
        // Restar 1 día para obtener el último día de ausencia real
        fechaFinAusencia.setDate(fechaFinAusencia.getDate() - 1);
        
        // Formatear de nuevo a YYYY-MM-DD
        const mes = String(fechaFinAusencia.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaFinAusencia.getDate()).padStart(2, '0');
        const fechaFinStr = `${fechaFinAusencia.getFullYear()}-${mes}-${dia}`;
        
        // Si el inicio y el fin son el mismo día (permiso de 1 día), mostrar solo esa fecha
        if (s.FechaInicio === fechaFinStr) {
          return s.FechaInicio;
        }
        
        return `${s.FechaInicio} → ${fechaFinStr}`;
      }
      return `${s.FechaInicio} → ${s.FechaReintegro}`;
    }
    
    if (s.FechaPermiso && s.HorarioInicio && s.HorarioFin) {
      const ini = s.HorarioInicio.substring(0, 5);   // 'HH:mm'
      const fin = s.HorarioFin.substring(0, 5);
      return `${s.FechaPermiso} · ${ini}–${fin}`;
    }
    
    if (s.FechaEvento) {
      const hora = s.HoraEvento ? ` · ${s.HoraEvento.substring(0, 5)}` : '';
      return `${s.FechaEvento}${hora}`;
    }
    
    return '—';
  }

  /** Cantidad legible: "5 días" o "2.5h" */
  getCantidad(s: SolicitudListado): string {
    if (s.CantidadDias)  return `${s.CantidadDias}d`;
    if (s.CantidadHoras) return `${s.CantidadHoras}h`;
    return '—';
  }

  /** Clase CSS según el tipo (pinta el badge) */
  claseTipo(idTipo: number): string {
    switch (idTipo) {
      case 1: return 'badge-tipo-permiso';      // ámbar
      case 2: return 'badge-tipo-licencia';     // rojo
      case 3: return 'badge-tipo-incidencia';   // gris
      case 4: return 'badge-tipo-vacaciones';   // verde
      default: return 'badge-default';
    }
  }

  /** Clase CSS según el estado */
  claseEstado(idEstado: number): string {
    switch (idEstado) {
      case 1: return 'badge-estado-pendiente';
      case 2: return 'badge-estado-aprobada';
      case 3: return 'badge-estado-rechazada';
      case 4: return 'badge-estado-en-curso';
      case 5: return 'badge-estado-finalizada';
      case 6: return 'badge-estado-cancelada';
      default: return 'badge-default';
    }
  }

  /** Iniciales del empleado para el avatar */
  iniciales(nombre: string): string {
    if (!nombre) return '??';
    const partes = nombre.trim().split(' ');
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
  }

}
