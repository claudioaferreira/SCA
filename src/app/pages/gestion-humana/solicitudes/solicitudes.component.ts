import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { GestionHumanaService } from '../../../services/gestion-humana.service';
import { SolicitudListado }     from '../../../interfaces/solicitud.interface';
import { Router } from '@angular/router';
import { CatalogosService } from '../../../services/catalogos.service';
import { EstadoSolicitud, TipoSolicitud } from '../../../interfaces/asignacion.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.scss'
})
export class SolicitudesComponent implements  OnInit  {

  subiendoImg  = false;
  errorImagen  = '';
  imagenPreview: string | null = null;
  imagenSeleccionada: File | null = null;
  imagenZoom: string | null = null;

  private readonly TIPOS_IMAGEN  = ['image/jpeg', 'image/png'];
  private readonly TAMANO_MAXIMO = 3 * 1024 * 1024;

  // ── INYECCIÓN DE SERVICIOS ───────────────────────────────────
  private ghService = inject(GestionHumanaService);
  private router = inject(Router);
  private catalogosService = inject(CatalogosService);

  // Filtros locales
  filtroTexto      = '';
  filtroIdTipo     = 0;     // 0 = todos
  filtroIdEstado   = 0;

    // ── ESTADO DE LA PANTALLA ─────────────────────────────────────
  loading = false;
  solicitudes: SolicitudListado[] = [];
  tipos:   TipoSolicitud[]   = [];
  estados: EstadoSolicitud[] = [];

  // ── ESTADO DEL MODAL ─────────────────────────────────────────────
  modalDetalle: SolicitudListado | null = null;
  modalEstado: SolicitudListado | null  = null;
  nuevoEstado: number | null            = null;


  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarCatalogos();
  }

  getImagenUrl(id: number): string {
  return this.ghService.getImagenUrl(id);
}

  // ── ABRIR MODAL ──────────────────────────────────────────────
  verDetalle(s: SolicitudListado): void {
  this.modalDetalle = s;
}

// Abrir modal cambiar estado
abrirCambioEstado(s: SolicitudListado): void {
  this.modalEstado = s;
  this.nuevoEstado = s.IdEstadoSolicitud;
}

guardarEstado(): void {
  if (!this.modalEstado || !this.nuevoEstado) return;
  this.ghService.updateEstadoSolicitud(this.modalEstado.IdSolicitud, this.nuevoEstado).subscribe({
    next: () => {
      Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1300, showConfirmButton: false });
      this.modalEstado = null;
      this.cargarSolicitudes();
    },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar' }),
  });
}

async eliminar(s: SolicitudListado): Promise<void> {
  const conf = await Swal.fire({
    icon: 'warning',
    title: '¿Eliminar solicitud?',
    text: `Solicitud de ${s.Empleado} — ${s.TipoSolicitud}`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: 'var(--danger)',
  });
  if (!conf.isConfirmed) return;

  this.ghService.deleteSolicitud(s.IdSolicitud).subscribe({
    next: () => {
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
      this.cargarSolicitudes();
    },
    error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar' }),
  });
}

  // ── NAVEGACIÓN ──────────────────────────────────────────────
  irANuevaSolicitud(): void {
  this.router.navigate(['/gestion-humana/solicitudes/nueva']);
}

private cargarCatalogos(): void {
  this.catalogosService.getTiposSolicitud().subscribe({
    next: (res) => this.tipos = res.body ?? [],
  });
  this.catalogosService.getEstadosSolicitud().subscribe({
    next: (res) => this.estados = res.body ?? [],
  });
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
get solicitudesFiltradas(): SolicitudListado[] {
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
  const formatearHora = (h: string): string => {
    // Si viene como ISO (1970-01-01T04:00:00.000Z), extraer HH:mm de UTC
    if (h.includes('T')) {
      const d = new Date(h);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
    return h.substring(0, 5); // ya viene como "HH:mm" o "HH:mm:ss"
  };
  return `${s.FechaPermiso} · ${formatearHora(s.HorarioInicio)}–${formatearHora(s.HorarioFin)}`;
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
  const alias = this.tipos.find(t => t.IdTipoSolicitud === idTipo)?.Alias ?? 'default';
  return `badge-tipo-${alias}`;
}

  /** Clase CSS según el estado */
  claseEstado(idEstado: number): string {
  const alias = this.estados.find(e => e.IdEstadoSolicitud === idEstado)?.Alias ?? 'default';
  return `badge-estado-${alias}`;
}

  /** Iniciales del empleado para el avatar */
  iniciales(nombre: string): string {
    if (!nombre) return '??';
    const partes = nombre.trim().split(' ');
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  onImagenSeleccionada(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file  = input.files?.[0];

  this.errorImagen       = '';
  this.imagenSeleccionada = null;
  this.imagenPreview     = null;

  if (!file) return;

  if (!this.TIPOS_IMAGEN.includes(file.type)) {
    this.errorImagen = 'Solo se permiten JPG o PNG';
    return;
  }
  if (file.size > this.TAMANO_MAXIMO) {
    this.errorImagen = `Pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 3MB`;
    return;
  }

  this.imagenSeleccionada = file;
  const reader = new FileReader();
  reader.onload = (e) => this.imagenPreview = e.target?.result as string;
  reader.readAsDataURL(file);
}

subirImagenDetalle(): void {
  if (!this.modalDetalle || !this.imagenSeleccionada) return;

  this.subiendoImg = true;
  this.ghService.subirImagen(this.modalDetalle.IdSolicitud, this.imagenSeleccionada)
    .subscribe({
      next: () => {
        this.subiendoImg        = false;
        this.imagenSeleccionada = null;
        this.imagenPreview      = null;
        // Recargar para que el badge de imagen aparezca
        this.cargarSolicitudes();
        Swal.fire({
          icon: 'success', title: 'Imagen subida',
          timer: 1300, showConfirmButton: false,
        });
      },
      error: (err) => {
        this.subiendoImg = false;
        this.errorImagen = err?.error?.message ?? 'No se pudo subir';
      },
    });
}

// Limpiar estado del upload al cerrar el modal
cerrarDetalle(): void {
  this.modalDetalle       = null;
  this.imagenSeleccionada = null;
  this.imagenPreview      = null;
  this.errorImagen        = '';
}

}
