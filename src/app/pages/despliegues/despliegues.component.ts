import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

import { DesplieguesService } from '../../services/despliegues.service';
import { CatalogosService }   from '../../services/catalogos.service';
import { EmpleadosService }   from '../../services/empleados.service';
import { SocketService }      from '../../services/socket.service';

import { Despliegue, DetalleRuta, CentroDetalle, RutaForm } from '../../interfaces/despliegue.interface';
import { Empleado, CentroCedulacion, ZonaGeo } from '../../interfaces/asignacion.interface';
import { DesplieguesExcelService } from '../../services/despliegues-excel.service';

interface ZonaOperativa {
  IdZonasOperativas: number;
  Descripcion:       string;
  zonaGeoId:         number;
}

@Component({
  selector: 'app-despliegues',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './despliegues.component.html',
  styleUrl: './despliegues.component.scss',
})
export class DesplieguesComponent implements OnInit, OnDestroy {

  // ── Servicios ─────────────────────────────────────────────────────────────
  private svc      = inject(DesplieguesService);
  private catalogos = inject(CatalogosService);
  private empSvc   = inject(EmpleadosService);
  private excelSvc = inject(DesplieguesExcelService);
  private socketSvc = inject(SocketService);

  // Variable para guardar la suscripción y poder destruirla después
  private socketSub!: Subscription;

  private estadosCentros = new Map<number, string | null>();
  readonly hoy = new Date();

  rutasExpandidas = new Set<number>();

  // ── Vista ─────────────────────────────────────────────────────────────────
  vista: 'lista' | 'detalle' = 'lista';

  // ── Lista ─────────────────────────────────────────────────────────────────
  loading      = false;
  despliegues: Despliegue[] = [];
  terminoBusquedaDetalle = '';

  // ── Detalle ───────────────────────────────────────────────────────────────
  detalleActual:  Despliegue | null = null;
  rutas:          DetalleRuta[]     = [];
  loadingDetalle  = false;

  // ── Catálogos ─────────────────────────────────────────────────────────────
  zonasOperativas: ZonaOperativa[]    = [];
  zonasGeo:        ZonaGeo[]          = [];
  empleados:       Empleado[]         = [];
  centrosTodos:    CentroCedulacion[] = [];

  // ── Modal crear despliegue (solo título y fechas) ─────────────────────────
  modalCrear  = false;
  guardandoCrear = false;
  formCrear   = { titulo: '', fechaInicio: '', fechaFin: '' };

  // ── Modal agregar / editar ruta ───────────────────────────────────────────
  modalRuta     = false;
  guardandoRuta = false;
  rutaEditando: DetalleRuta | null = null;  // null = nueva ruta, ruta = editar

  formRuta: RutaForm = this.rutaVacia();

  // ── Filtro de centros dentro del modal ────────────────────────────────────
  zonaFiltroModal = 0;
  verTodosLosCentros = false;

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargar();
    this.cargarCatalogos();

    if (this.socketSub) {
    this.socketSub.unsubscribe();
  }
  
    // 5. ── INICIAMOS LA ESCUCHA EN TIEMPO REAL ─────────────────────────────
    this.socketSub = this.socketSvc.escucharEvento('despliegues-cambio').subscribe((cambio) => {
      //console.log('📢 Actualización en tiempo real recibida:', cambio);
      
      // 1. Siempre recargamos la lista general de fondo para mantenerla fresca
      this.cargar();

      // 2. Si el usuario está viendo el detalle de un despliegue en este momento...
      if (this.vista === 'detalle' && this.detalleActual) {
        
        // Verificamos si el cambio corresponde al despliegue que tiene abierto
        // (Por ejemplo, alguien le agregó una ruta o actualizó un centro de ESE despliegue)
        const idAfectado = cambio.idDespliegue || (cambio.accion === 'actualizarEstadoCentro' ? this.detalleActual.IdDespliegue : null);
        
        if (idAfectado === this.detalleActual.IdDespliegue) {
          // Recargamos silenciosamente los datos de las rutas para mostrar el cambio
          this.svc.getById(this.detalleActual.IdDespliegue).subscribe({
            next: (res) => { this.rutas = res.body ?? []; }
          });
        }
        
        // Si borraron el despliegue que el usuario está viendo actualmente, lo regresamos a la lista
        if (cambio.accion === 'eliminar' && cambio.idDespliegue === this.detalleActual.IdDespliegue) {
           Swal.fire('Atención', 'Este despliegue acaba de ser eliminado por otro usuario.', 'info');
           this.volverALista();
        }
      }
    });
  }

  // 6. ── LIMPIEZA AL DESTRUIR EL COMPONENTE ────────────────────────────────
  ngOnDestroy(): void {
    // Evitamos fugas de memoria apagando la antena cuando cambiamos de pantalla
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  toggleRuta(idRuta: number): void {
  this.rutasExpandidas.has(idRuta)
    ? this.rutasExpandidas.delete(idRuta)
    : this.rutasExpandidas.add(idRuta);
}

rutaExpandida(idRuta: number): boolean {
  return this.rutasExpandidas.has(idRuta);
}

contarCentros(ruta: DetalleRuta): number {
  return this.parseCentros(ruta.CentrosJSON).length;
}

  // ── LISTA ─────────────────────────────────────────────────────────────────
  cargar(mostrarCarga = true): void {
  if (mostrarCarga) this.loading = true;
  this.svc.getAll().subscribe({
    next: (res) => { this.despliegues = res.body ?? []; this.loading = false; },
    error: ()    => { this.loading = false; },
  });
}

  /** Devuelve el estado actual del centro (local override o el de la BD) */
getEstadoCentro(idRutaCentro: number, estadoOriginal: string | null): string | null {
  return this.estadosCentros.has(idRutaCentro)
    ? (this.estadosCentros.get(idRutaCentro) ?? null)
    : estadoOriginal;
}

/** Alterna entre Listo / Pendiente */
toggleCentroListo(idRutaCentro: number, estadoActual: string | null): void {
  const nuevoEstado = estadoActual === 'Listo' ? null : 'Listo';
  this.svc.actualizarEstadoCentro(idRutaCentro, nuevoEstado).subscribe({
    next: () => {
      // Actualiza localmente — sin llamar al backend de nuevo
      this.estadosCentros.set(idRutaCentro, nuevoEstado);
    },
    error: () => Swal.fire({
      icon: 'error', title: 'Error al actualizar', timer: 1500, showConfirmButton: false,
    }),
  });
}

  verDetalle(d: Despliegue): void {
      this.rutasExpandidas.clear();
    this.estadosCentros.clear();
    this.detalleActual  = d;
    this.vista          = 'detalle';
    this.loadingDetalle = true;
    this.rutas          = [];

    this.svc.getById(d.IdDespliegue).subscribe({
      next: (res) => { this.rutas = res.body ?? []; this.loadingDetalle = false; },
      error: ()    => { this.loadingDetalle = false; },
    });
  }

  todasListasPorRuta(ruta: DetalleRuta): boolean {
  const centros = this.parseCentros(ruta.CentrosJSON);
  if (centros.length === 0) return false;
  return centros.every(c =>
    this.getEstadoCentro(c.IdRutaCentro, c.Estado ?? null) === 'Listo'
  );
}

  volverALista(): void {
    this.vista         = 'lista';
    this.detalleActual = null;
    this.rutas         = [];
  }

  // ── CREAR DESPLIEGUE ──────────────────────────────────────────────────────
  abrirCrear(): void {
    this.formCrear    = { titulo: '', fechaInicio: '', fechaFin: '' };
    this.guardandoCrear = false;
    this.modalCrear   = true;
  }

  cerrarCrear(): void { this.modalCrear = false; }

  guardarDespliegue(): void {
    const { titulo, fechaInicio, fechaFin } = this.formCrear;
    if (!titulo || !fechaInicio || !fechaFin) {
      Swal.fire({ icon: 'warning', title: 'Completa todos los campos', timer: 1500, showConfirmButton: false });
      return;
    }

    this.guardandoCrear = true;
    this.svc.crear({ titulo, fechaInicio, fechaFin, rutas: [] }).subscribe({
      next: (res) => {
        this.guardandoCrear = false;
        this.cerrarCrear();
        Swal.fire({ icon: 'success', title: 'Despliegue creado', timer: 1200, showConfirmButton: false });
        // Recargar lista y abrir el detalle del nuevo despliegue
        this.cargar();
        // Ir al detalle inmediatamente
        const nuevo: Despliegue = {
          IdDespliegue:  res.body.idDespliegue,
          Titulo:        titulo,
          FechaInicio:   fechaInicio,
          FechaFin:      fechaFin,
          Estado:        'Activo',
          FechaCreacion: new Date().toISOString().split('T')[0],
          TotalRutas:    0,
          TotalTecnicos: 0,
        };
        this.verDetalle(nuevo);
      },
      error: (err) => {
        this.guardandoCrear = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message ?? 'No se pudo crear' });
      },
    });
  }

  // ── ELIMINAR DESPLIEGUE ───────────────────────────────────────────────────
  async eliminar(d: Despliegue, event: Event): Promise<void> {
    event.stopPropagation();
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar despliegue?',
      html: `<p>Se eliminará <strong>${d.Titulo}</strong> junto con todas sus rutas y asignaciones.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!conf.isConfirmed) return;

    this.svc.eliminar(d.IdDespliegue).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
        if (this.vista === 'detalle') this.volverALista();
        this.cargar();
      },
      error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message ?? 'No se pudo eliminar' }),
    });
  }

  // ── FINALIZAR DESPLIEGUE ──────────────────────────────────────────────────
  async finalizar(d: Despliegue): Promise<void> {
    const conf = await Swal.fire({
      icon: 'question',
      title: '¿Finalizar despliegue?',
      text: 'Todos los técnicos quedarán disponibles.',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
    });
    if (!conf.isConfirmed) return;

    this.svc.finalizar(d.IdDespliegue).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Despliegue finalizado', timer: 1400, showConfirmButton: false });
        this.cargar();
        if (this.detalleActual?.IdDespliegue === d.IdDespliegue) {
          this.detalleActual = { ...d, Estado: 'Finalizado' };
          this.verDetalle(this.detalleActual);
        }
      },
      error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message ?? 'Error' }),
    });
  }

  // ── AGREGAR RUTA (modal) ──────────────────────────────────────────────────
  abrirAddRuta(): void {
    this.rutaEditando      = null;
    this.formRuta          = this.rutaVacia();
    this.zonaFiltroModal   = 0;
    this.verTodosLosCentros = false;
    this.guardandoRuta     = false;
    this.modalRuta         = true;
  }

  // ── EDITAR RUTA (modal) ───────────────────────────────────────────────────
  abrirEditarRuta(ruta: DetalleRuta): void {
    this.rutaEditando = ruta;
    const centros     = this.parseCentros(ruta.CentrosJSON);
    this.formRuta     = {
      nombre:          ruta.Nombre,
      modoZona:        ruta.IdZonaOperativa ? 'operativa' : 'geo',
      idZonaOperativa: ruta.IdZonaOperativa,
       idZonaGeo:       null,
      idEmpleado:      ruta.IdEmpleado,
      comentario:      ruta.Comentario ?? '',
      centros: centros.map(c => ({ idCentro: c.IdCentro, orden: c.Orden })),
    };
    this.zonaFiltroModal    = ruta.IdZonaOperativa ?? 0;
    this.verTodosLosCentros = false;
    this.guardandoRuta      = false;
    this.modalRuta          = true;
  }

  cerrarModalRuta(): void { this.modalRuta = false; }

  guardarRuta(): void {
      if (!this.detalleActual) return;
      if (this.formRuta.centros.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Selecciona al menos un centro', timer: 1500, showConfirmButton: false });
        return;
      }

          if (!this.formRuta.idZonaOperativa && this.formRuta.centros.length > 0) {
          const primerIdCentro = this.formRuta.centros[0].idCentro;
          const centro = this.centrosTodos.find(c => c.IdCentroCedulacion === primerIdCentro);
          if (centro?.IdZonasOperativas) {
            this.formRuta.idZonaOperativa = centro.IdZonasOperativas;
          }
        }

    this.guardandoRuta = true;

    if (this.rutaEditando) {
      // ── Editar ruta existente ──────────────────────────────────────────
      const payloadEditar = {
        ...this.formRuta,
        fechaInicio: this.detalleActual!.FechaInicio,
        fechaFin:    this.detalleActual!.FechaFin,
        titulo:      this.detalleActual!.Titulo,
      };
      this.svc.actualizarRuta(this.rutaEditando.IdRuta, payloadEditar).subscribe({
        next: () => {
          this.guardandoRuta = false;
          this.cerrarModalRuta();
          Swal.fire({ icon: 'success', title: 'Ruta actualizada', timer: 1200, showConfirmButton: false });
          this.verDetalle(this.detalleActual!);
        },
        error: (err) => {
          this.guardandoRuta = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message ?? 'Error' });
        },
      });
    } else {
      // ── Nueva ruta ────────────────────────────────────────────────────
      const payload = {
        ...this.formRuta,
        fechaInicio: this.detalleActual.FechaInicio,
        fechaFin:    this.detalleActual.FechaFin,
        titulo:      this.detalleActual.Titulo,
      };
      this.svc.addRuta(this.detalleActual.IdDespliegue, payload).subscribe({
        next: () => {
          this.guardandoRuta = false;
          this.cerrarModalRuta();
          Swal.fire({ icon: 'success', title: 'Ruta agregada', timer: 1200, showConfirmButton: false });
          this.verDetalle(this.detalleActual!);
        },
        error: (err) => {
          this.guardandoRuta = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message ?? 'Error' });
        },
      });
    }
  }

  /** Limpia la selección de zona y centros al cambiar de modo */
limpiarZona(): void {
  this.formRuta.idZonaOperativa = null;
  this.formRuta.idZonaGeo       = null;
  this.zonaFiltroModal          = 0;
  this.formRuta.centros         = [];
}

  // ── CENTROS — Opción C ────────────────────────────────────────────────────

  /** Cuando cambia la zona → auto-carga y pre-selecciona todos los centros */
  onZonaChange(idZona: number): void {
    this.zonaFiltroModal = idZona;

    if (!idZona) return;

    // Nombre de la zona para auto-llenar el nombre de la ruta
    const zona = this.zonasOperativas.find(z => z.IdZonasOperativas === idZona);
    if (zona && !this.formRuta.nombre) {
      this.formRuta.nombre = zona.Descripcion;
    }

    // Auto-seleccionar todos los centros de la zona
    this.seleccionarTodosDeZona(idZona);
  }

  onZonaGeoChange(idZonaGeo: number): void {
  this.formRuta.idZonaGeo        = idZonaGeo;
  this.formRuta.idZonaOperativa  = null;
  this.zonaFiltroModal           = 0;

  // Filtrar centros por ZonaGeo directamente
  const centros = this.centrosTodos.filter(c => c.IdZonaGeo === idZonaGeo);
  this.formRuta.centros = centros.map((c, i) => ({
    idCentro: c.IdCentroCedulacion, orden: i + 1,
  }));
}

  /** Centros que se muestran en el modal según el filtro */
  get centrosMostrados(): CentroCedulacion[] {
    if (this.verTodosLosCentros || !this.zonaFiltroModal) {
      return this.centrosTodos;
    }
    return this.centrosTodos.filter(c => c.IdZonasOperativas === this.zonaFiltroModal);
  }

  /** Centros agrupados por ZonaOperativa para mostrar con cabecera */
  get centrosAgrupados(): { zona: string; centros: CentroCedulacion[] }[] {
    const grupos: { [zona: string]: CentroCedulacion[] } = {};
    for (const c of this.centrosMostrados) {
      const zona = c.ZonaOperativa ?? 'Sin zona';
      if (!grupos[zona]) grupos[zona] = [];
      grupos[zona].push(c);
    }
    return Object.entries(grupos).map(([zona, centros]) => ({ zona, centros }));
  }

  seleccionarTodosDeZona(idZona: number): void {
    const centros = this.centrosTodos.filter(c => c.IdZonasOperativas === idZona);
    // Agregar los que no estén ya
    for (const c of centros) {
      if (!this.formRuta.centros.some(x => x.idCentro === c.IdCentroCedulacion)) {
        this.formRuta.centros.push({ idCentro: c.IdCentroCedulacion, orden: this.formRuta.centros.length + 1 });
      }
    }
  }

  deseleccionarTodosDeZona(idZona: number): void {
    const idsZona = this.centrosTodos
      .filter(c => c.IdZonasOperativas === idZona)
      .map(c => c.IdCentroCedulacion);
    this.formRuta.centros = this.formRuta.centros.filter(c => !idsZona.includes(c.idCentro));
    this.recalcularOrden();
  }

  todosDeLaZonaSeleccionados(idZona: number): boolean {
    const centros = this.centrosTodos.filter(c => c.IdZonasOperativas === idZona);
    return centros.length > 0 && centros.every(c =>
      this.formRuta.centros.some(x => x.idCentro === c.IdCentroCedulacion)
    );
  }

  toggleCentro(idCentro: number): void {
    const idx = this.formRuta.centros.findIndex(c => c.idCentro === idCentro);
    if (idx === -1) {
      this.formRuta.centros.push({ idCentro, orden: this.formRuta.centros.length + 1 });
    } else {
      this.formRuta.centros.splice(idx, 1);
      this.recalcularOrden();
    }
  }

  centroSeleccionado(idCentro: number): boolean {
    return this.formRuta.centros.some(c => c.idCentro === idCentro);
  }

  private recalcularOrden(): void {
    this.formRuta.centros.forEach((c, i) => c.orden = i + 1);
  }

  contarListosPorRuta(ruta: DetalleRuta): number {
  return this.parseCentros(ruta.CentrosJSON)
    .filter(c => this.getEstadoCentro(c.IdRutaCentro, c.Estado ?? null) === 'Listo')
    .length;
}

get resumenCentros(): { total: number; listos: number; faltantes: number } {
  let total = 0;
  let listos = 0;

  for (const ruta of this.rutas) {
    const centros = this.parseCentros(ruta.CentrosJSON);
    total  += centros.length;
    listos += centros.filter(c =>
      this.getEstadoCentro(c.IdRutaCentro, c.Estado ?? null) === 'Listo'
    ).length;
  }

  return { total, listos, faltantes: total - listos };
}

  /** Filtra rutas por empleado, zona, centro, código o número de ruta */
get rutasFiltradas(): DetalleRuta[] {
  const t = this.terminoBusquedaDetalle.toLowerCase().trim();
  if (!t) return this.rutas;

  return this.rutas.filter(ruta => {
    if (ruta.ZonaOperativa?.toLowerCase().includes(t))  return true;
    if (ruta.Nombre?.toLowerCase().includes(t))          return true;
    if (ruta.Empleado?.toLowerCase().includes(t))        return true;
    if (ruta.CodigoEmpleado?.toLowerCase().includes(t))  return true;
    if (ruta.NumeroRuta?.toString().includes(t))         return true;
    // También busca dentro de los centros de cedulación
    return this.parseCentros(ruta.CentrosJSON)
      .some(c => c.Centro?.toLowerCase().includes(t));
  });
}

  // ── TABLA DETALLE (Excel) ──────────────────────────────────────────────────
  get filasTabla(): { no: number; ruta: DetalleRuta; centro: CentroDetalle; esPrimera: boolean }[] {
    const filas: { no: number; ruta: DetalleRuta; centro: CentroDetalle; esPrimera: boolean }[] = [];
    let no = 1;
    for (const ruta of this.rutasFiltradas) {
      const centros = this.parseCentros(ruta.CentrosJSON);
      if (centros.length === 0) {
        filas.push({ no, ruta, centro: { IdRutaCentro: 0, IdCentro: 0, Centro: '—', Orden: 1 }, esPrimera: true });
        no++;
      } else {
        centros.forEach((c, i) => {
          filas.push({ no, ruta, centro: c, esPrimera: i === 0 });
          no++;
        });
      }
    }
    return filas;
  }

  parseCentros(json: string | null): CentroDetalle[] {
    if (!json) return [];
    try { return JSON.parse(json); }
    catch { return []; }
  }

  imprimir(): void { window.print(); }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  private rutaVacia(): RutaForm {
  return {
    nombre: '', modoZona: 'operativa',
    idZonaOperativa: null, idZonaGeo: null,
    idEmpleado: null, comentario: '', centros: [],
  };
}

  badgeEstado(estado: string): string {
    switch (estado) {
      case 'Activo':     return 'badge-activo';
      case 'Finalizado': return 'badge-finalizado';
      case 'Cancelado':  return 'badge-cancelado';
      default:           return '';
    }
  }

  // ── CATÁLOGOS ─────────────────────────────────────────────────────────────
  private cargarCatalogos(): void {
  this.empSvc.getEmpleadosActivos().subscribe({
    next: (data: any) => this.empleados = data ?? [],
  });
  this.catalogos.getCentrosCedulacion().subscribe({
    next: (res: any) => this.centrosTodos = res.body ?? [],
  });
  this.catalogos.getZonasOperativas().subscribe({
    next: (res: any) => this.zonasOperativas = res.body ?? [],
  });
  // ← agregar esto
  this.catalogos.getZonasGeo().subscribe({
    next: (res: any) => this.zonasGeo = res.body ?? [],
  });
}


async exportarExcel(): Promise<void> {
  await this.excelSvc.exportar(this.detalleActual!, this.rutas, this.estadosCentros);
}
}
