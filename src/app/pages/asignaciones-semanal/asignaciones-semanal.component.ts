import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

import { Empleado, TipoAsignacion, AsignacionCelda } from '../../interfaces/asignacion.interface';
import { EmpleadosService } from '../../services/empleados.service';


@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.scss'],
})
export class AsignacionesSemanalComponent implements OnInit {

  // ─── ESTADO GENERAL ─────────────────────────────────────────────────────

  loading     = false;
  diasSemana: Date[] = [];
  private lunesActual!: Date;


  // ─── EMPLEADOS ──────────────────────────────────────────────────────────

  empleadosMaster: Empleado[] = [];


  // ─── TIPOS DE ASIGNACIÓN ────────────────────────────────────────────────

  tipos: TipoAsignacion[] = [];

  /**
   * Tipos que bloquean al técnico toda la semana.
   * Metro (2), Interior (3) y Exterior (4) solo se pueden asignar una vez.
   * Sede Central (1) NO bloquea — el técnico puede tener sede y otro tipo.
   */
  private readonly TIPOS_CON_LIMITE: number[] = [2, 3, 4];


  // ─── ASIGNACIONES (CELDAS) ──────────────────────────────────────────────

  dataTemporal: Record<string, AsignacionCelda[]> = {};
  private uidCounter = 0;
  chipExpandido = new Set<string>();


  // ─── BÚSQUEDA Y FILTROS ─────────────────────────────────────────────────

  terminoBusqueda = '';
  filtrosActivos  = new Set<string>();

  // @deprecated — usar filtrosActivos en su lugar
  // filtroActivo: string = 'ninguno';


  // ─── CONSTRUCTOR ────────────────────────────────────────────────────────

  constructor(private _empleadosService: EmpleadosService) {}


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CICLO DE VIDA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ngOnInit() {
    this.irASemanaActual();
    this.obtenerTiposAsignaciones(); // catálogo primero, no depende de nada
    this.cargarEmpleadosDeAPI();     // empleados + asignaciones + historial
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  NAVEGACIÓN DE SEMANA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Mueve la vista a la semana actual */
  irASemanaActual() {
    this.setSemana(this.getLunesDe(new Date()));
  }

  /** Avanza (+1) o retrocede (-1) una semana */
  navegarSemana(direccion: 1 | -1) {
    this.loading = true;
    const nuevoLunes = new Date(this.lunesActual);
    nuevoLunes.setDate(nuevoLunes.getDate() + direccion * 7);
    this.setSemana(nuevoLunes);
    this.recargarSemana();
  }

  /** Devuelve true si la semana en pantalla es la semana actual */
  esSemanaActual(): boolean {
    const lunesHoy = this.getLunesDe(new Date());
    return (
      this.lunesActual.toISOString().split('T')[0] ===
      lunesHoy.toISOString().split('T')[0]
    );
  }

  /** Calcula el lunes de la semana que contiene la fecha dada */
  private getLunesDe(fecha: Date): Date {
    const d    = new Date(fecha);
    const dia  = d.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Rellena diasSemana[] con los 7 días a partir del lunes dado */
  private setSemana(lunes: Date) {
    this.lunesActual = new Date(lunes);
    this.diasSemana  = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  /** Devuelve las fechas de inicio y fin de la semana visible */
  private getRangoSemana() {
    return {
      inicio: this.diasSemana[0].toISOString().split('T')[0],
      fin:    this.diasSemana[6].toISOString().split('T')[0],
    };
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  TIPOS DE ASIGNACIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/asignaciones/tipoasignaciones
  // Trae el catálogo de tipos (Sede, Metro, Interior, Exterior).
  // Se llama una sola vez al abrir el componente.
  // ─────────────────────────────────────────────────────────────────────────
  obtenerTiposAsignaciones() {
    this._empleadosService.getTipoAsignaciones().subscribe({
      next: (res: any) => {
        this.tipos = (res.body ?? []).map((t: any) => ({
          IdTipo: t.IdTipo,
          nombre: t.nombre,
        }));
      },
      error: (err) => console.error('Error al cargar tipos:', err),
    });
  }

  /** Devuelve el nombre del tipo según su ID (ej: 2 → 'Metro') */
  getNombreTipo(tipoId: number): string {
  const nombre = this.tipos.find(t => t.IdTipo === tipoId)?.nombre ?? '';
  return nombre.substring(0, 3).toUpperCase();
}

  /**
   * Devuelve los tipos que aún puede elegir el técnico en ese día.
   * Excluye los tipos con límite que ya están guardados.
   */
  tiposDisponibles(empId: number, dia: Date, itemActual?: AsignacionCelda): TipoAsignacion[] {
    const key   = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];

    const tiposYaUsados = new Set(
      items
        .filter(i => !i.esNueva && i.uid !== itemActual?.uid && this.TIPOS_CON_LIMITE.includes(i.tipoId))
        .map(i => i.tipoId)
    );

    return this.tipos.filter(t => {
      if (!this.TIPOS_CON_LIMITE.includes(t.IdTipo)) return true;
      return !tiposYaUsados.has(t.IdTipo);
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EMPLEADOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/empleados/activos
  // Trae la lista completa de empleados activos.
  // Al terminar dispara cargarAsignacionesSemana y cargarHistorialDesdeBD.
  // ─────────────────────────────────────────────────────────────────────────
  cargarEmpleadosDeAPI() {
    this.loading = true;
    this._empleadosService.getEmpleadosActivos().subscribe({
      next: (data) => {
        this.empleadosMaster = data;

        // Inicializa stats en 0 para empleados que no tengan historial aún
        this.empleadosMaster.forEach((emp) => {
          emp.stats = {
            // MES
            totalSede: 0,
            metroMes: 0,
            totalInterior: 0,
            diasNorte: 0,
            diasSur: 0,
            diasEste: 0,

            // SEMANA
            totalSedeSemana: 0,
            metroSemana: 0,
            totalInteriorSemana: 0
          };
});

        this.ordenarListaAlfabeticamente();
        this.inicializarDataTemporal();
        this.cargarAsignacionesSemana();
        this.cargarHistorialDesdeBD();
      
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.loading = false;
      },
    });
  }

  /** Ordena empleadosMaster de A a Z por nombre */
  private ordenarListaAlfabeticamente() {
    this.empleadosMaster.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  /** Devuelve true si el técnico tiene alguna asignación activa esta semana */
  empleadoEstaOcupado(empId: number): boolean {
    return this.diasSemana.some((dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      return items.some(i => i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId));
    });
  }

  /** Convierte el nombre completo de la posición a una versión corta */
  abreviarPosicion(posicion: string | undefined): string {
    if (!posicion) return 'Soporte';
    return posicion
      .replace(/Soporte Tecnico III/gi,   'SOPORTE III')
      .replace(/Soporte Tecnico II/gi,    'SOPORTE II')
      .replace(/Soporte Tecnico I/gi,     'SOPORTE I')
      .replace(/Soporte Tecnico/gi,       'SOPORTE')
      .replace(/Auxiliar/gi,              'AUX.')
      .replace(/SUPERVISOR\/A TECNICO/gi, 'SUP.TECNICO');
  }

  /** Quita todo lo que no sea número de un teléfono (para el link de WhatsApp) */
  limpiarTelefono(numero: string): string {
    return numero.replace(/\D/g, '');
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HISTORIAL DE EMPLEADOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/empleados/historial
  // Trae los contadores del mes (totalSede, metroMes, diasNorte/Sur/Este).
  // Se llama al inicio y después de cada guardar/eliminar para mantener
  // los contadores actualizados en la columna de historial.
  // ─────────────────────────────────────────────────────────────────────────
  private cargarHistorialDesdeBD() {
    this._empleadosService.getHistorialEmpleados().subscribe({
      next: (res: any) => {
        const rows: any[] = res.body ?? [];

        // Reinicia todos los contadores antes de acumular
        this.empleadosMaster.forEach((emp) => {
          if (emp.stats) {
            emp.stats.totalSede     = 0;
            emp.stats.metroMes      = 0;
            emp.stats.diasNorte     = 0;
            emp.stats.diasSur       = 0;
            emp.stats.diasEste      = 0;
            emp.stats.totalInterior = 0;
          }
        });

        // Acumula por empleado según el tipo de asignación
        rows.forEach((row) => {
          const emp = this.empleadosMaster.find(e => e.id === row.IdEmpleado);
          if (!emp?.stats) return;

          const cantidad = Number(row.TotalCantidad) || 0;
          const dias     = Number(row.TotalDias)     || 0;

          switch (row.IdTipo) {
            case 1: emp.stats.totalSede = (emp.stats.totalSede || 0) + cantidad; break;
            case 2: emp.stats.metroMes  = (emp.stats.metroMes  || 0) + cantidad; break;
            case 3:
              if (row.ZonaGeografica === 'Norte') emp.stats.diasNorte = (emp.stats.diasNorte || 0) + dias;
              if (row.ZonaGeografica === 'Sur')   emp.stats.diasSur   = (emp.stats.diasSur   || 0) + dias;
              if (row.ZonaGeografica === 'Este')  emp.stats.diasEste  = (emp.stats.diasEste  || 0) + dias;
              break;
          }
        });

        // totalInterior = suma de los tres zonas
        this.empleadosMaster.forEach((emp) => {
          if (emp.stats) {
            emp.stats.totalInterior =
              (emp.stats.diasNorte || 0) +
              (emp.stats.diasSur   || 0) +
              (emp.stats.diasEste  || 0);
          }
        });
      },
      error: (err) => console.error('Error al cargar historial:', err),
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ASIGNACIONES — CARGA Y RECARGA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/asignaciones?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
  // Trae las asignaciones de la semana visible y las coloca en dataTemporal.
  // Se llama al cargar empleados y al navegar entre semanas.
  // ─────────────────────────────────────────────────────────────────────────
 private cargarAsignacionesSemana() {
  const { inicio, fin } = this.getRangoSemana();
  this._empleadosService.getAsignacionesSemana(inicio, fin).subscribe({
    next: (res: any) => {
      const asignaciones: any[] = res.body ?? [];
      asignaciones.forEach((a) => {
         const fechaStr = (a.Fecha as string).substring(0, 10);
         const key = `${a.IdEmpleado}-${fechaStr}`;
        if (this.dataTemporal[key] !== undefined) {
          this.dataTemporal[key].push(this.mapearDesdeAPI(a));
        }
      });
      this.loading = false;
       // ← aquí, cuando dataTemporal ya está listo
    },
    error: (err) => {
      console.error('Error al cargar asignaciones:', err);
      this.loading = false;
    },
  });
}

 getSedeSemana(empId: number): number {
  return this.diasSemana.reduce((total, dia) => {
    const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
    const tareas = items
      .filter(i => !i.esNueva && i.tipoId === 1)
      .reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);
    return total + tareas;
  }, 0);
}

getMetroSemana(empId: number): number {
  return this.diasSemana.reduce((total, dia) => {
    const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
    const rutas = items
      .filter(i => !i.esNueva && i.tipoId === 2)
      .reduce((sum, i) => sum + (Number(i.cantidadMetro) || 0), 0);
    return total + rutas;
  }, 0);
}

getInteriorExteriorSemana(empId: number): number {
  return this.diasSemana.reduce((total, dia) => {
    const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
    const dias = items
      .filter(i => !i.esNueva && (i.tipoId === 3 || i.tipoId === 4))
      .reduce((sum, i) => sum + (Number(i.dias) || 0), 0);
    return total + dias;
  }, 0);
}

  /** Recarga solo las asignaciones al navegar de semana (sin volver a pedir empleados) */
  private recargarSemana() {
  this.loading = true;
  this.inicializarDataTemporal();

  this.cargarAsignacionesSemana(); // tabla
}

  /** Crea entradas vacías en dataTemporal para cada combinación empleado+día */
  private inicializarDataTemporal() {
    this.empleadosMaster.forEach((emp) => {
      this.diasSemana.forEach((dia) => {
        this.dataTemporal[this.generarLlave(emp.id, dia)] = [];
      });
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ASIGNACIONES — AGREGAR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Intenta agregar una nueva fila vacía al técnico en ese día */
  agregarAsignacion(empId: number, dia: Date) {
    const key   = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];

    // Valida que el técnico no esté ocupado en ningún día de la semana
    for (const diaSemana of this.diasSemana) {
      const keySemana   = this.generarLlave(empId, diaSemana);
      const itemsSemana = this.dataTemporal[keySemana] ?? [];
      const asigOcupada = itemsSemana.find(
        i => !i.esNueva && i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)
      );
      if (asigOcupada) {
        this.mostrarAlertaTecnicoOcupado(diaSemana, asigOcupada);
        return;
      }
    }

    // Valida que no estén todos los tipos cubiertos para ese día
    const tiposGuardados = items
      .filter(i => !i.esNueva && this.TIPOS_CON_LIMITE.includes(i.tipoId))
      .map(i => i.tipoId);
    const todosUsados = this.TIPOS_CON_LIMITE.every(t => tiposGuardados.includes(t));

    if (todosUsados && this.tiposDisponibles(empId, dia).length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Todos los tipos asignados',
        text: 'Este técnico ya tiene todos los tipos cubiertos para este día.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    this.dataTemporal[key].push(this.nuevaCeldaVacia());
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ASIGNACIONES — GUARDAR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/asignaciones
  // Guarda una celda nueva en la base de datos.
  // Devuelve el idAsignacion generado para actualizar el item local.
  // ─────────────────────────────────────────────────────────────────────────
  guardarCelda(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item || item.tipoId === 0) return;

    // Evita guardar el mismo tipo dos veces en el mismo día
    if (this.TIPOS_CON_LIMITE.includes(item.tipoId)) {
      const duplicado = this.dataTemporal[key].some(
        (i) => i.uid !== item.uid && i.tipoId === item.tipoId && !i.esNueva
      );
      if (duplicado) {
        Swal.fire({
          icon: 'warning',
          title: 'Tipo duplicado',
          text: `Ya existe una asignación de tipo "${this.getNombreTipo(item.tipoId)}" guardada para este día.`,
          timer: 2500,
          showConfirmButton: false,
        });
        return;
      }
    }

    const fechaStr      = dia.toISOString().split('T')[0];
    const cantidadFinal = item.tipoId === 2 ? item.cantidadMetro : item.cantidad;

    const payload = {
      idEmpleado:           empId,
      fecha:                fechaStr,
      idTipo:               item.tipoId,
      CantidadAsignaciones: cantidadFinal || null,
      diasViaje:            item.dias     || null,
      zonaGeografica:       item.zona     || null,
      idEstado:             item.idEstado ?? 1,
      observaciones:        null,
    };

    this._empleadosService.guardarAsignacionCelda(payload).subscribe({
      next: (res: any) => {
        item.idAsignacion = res.body?.idAsignacion ?? null;
        item.uid          = `saved-${item.idAsignacion}`;
        item.modificado   = false;
        item.esNueva      = false;
        item.guardadoOk   = true;
        this.cargarHistorialDesdeBD();
       
        setTimeout(() => { item.guardadoOk = false; }, 2000);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        Swal.fire({
          icon: 'error', title: 'Error al guardar',
          text: 'Revisa tu conexión e intenta de nuevo.',
          timer: 3000, showConfirmButton: false,
        });
      },
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ASIGNACIONES — ELIMINAR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/asignaciones/:id
  // Elimina una asignación guardada. Si aún no fue guardada (esNueva),
  // solo la quita de la pantalla sin llamar al servidor.
  // ─────────────────────────────────────────────────────────────────────────
  eliminarAsignacion(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    Swal.fire({
      title: '¿Eliminar asignación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton:   true,
      confirmButtonText:  'Sí, eliminar',
      cancelButtonText:   'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor:  '#3085d6',
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (item.idAsignacion) {
        // Está guardada en BD → la elimina del servidor
        this._empleadosService.eliminarAsignacion(item.idAsignacion).subscribe({
          next: () => {
            this.dataTemporal[key].splice(index, 1);
            this.cargarHistorialDesdeBD();
          
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la asignación' }),
        });
      } else {
        // Nunca fue guardada → solo la quita de pantalla
        this.dataTemporal[key].splice(index, 1);
        
      }
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ASIGNACIONES — ESTADO (OCUPADO / DISPONIBLE)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
contarOcupados(): number {
  return this.empleadosMaster.filter(e => this.empleadoEstaOcupado(e.id)).length;
}
contarDisponibles(): number {
  return this.empleadosMaster.filter(e => !this.empleadoEstaOcupado(e.id)).length;
}
  // ─────────────────────────────────────────────────────────────────────────
  // PUT /api/asignaciones/:id/estado
  // Cambia el estado entre Ocupado (1) y Disponible (3).
  // Si la llamada al servidor falla, revierte el cambio en pantalla.
  // ─────────────────────────────────────────────────────────────────────────
  marcarComoDisponible(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
    item.idEstado = 3;

    if (!item.idAsignacion) return;

    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 3).subscribe({
      error: () => {
        item.idEstado = 1; // Revierte si falla
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo liberar al técnico.', timer: 3000, showConfirmButton: false });
      },
    });
  }

  marcarComoOcupado(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (item.tipoId === 1) return; // Sede Central no bloquea al técnico
    item.idEstado = 1;

    if (!item.idAsignacion) return;

    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 1).subscribe({
      error: () => {
        item.idEstado = 3; // Revierte si falla
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo marcar como ocupado.', timer: 3000, showConfirmButton: false });
      },
    });
  }

  /** Marca una celda como modificada cuando el usuario cambia algo en el formulario */
  marcarModificado(item: AsignacionCelda) {
    item.modificado = true;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  BÚSQUEDA Y FILTROS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Activa o desactiva un filtro al hacer clic en el chip */
  setFiltro(tipo: string) {
    if (tipo === 'ninguno') {
      this.filtrosActivos.clear();
      return;
    }
    if (this.filtrosActivos.has(tipo)) {
      this.filtrosActivos.delete(tipo);
    } else {
      this.filtrosActivos.add(tipo);
    }
  }

  /** Devuelve la lista de empleados con búsqueda y filtros aplicados */
  filtrarEmpleados() {
    const b = this.terminoBusqueda.toLowerCase();

    // 1. Filtra por texto de búsqueda
    let lista = this.empleadosMaster.filter(e =>
      e.nombre.toLowerCase().includes(b)     ||
      e.localidad?.toLowerCase().includes(b) ||
      e.codigo.includes(b)
    );

    // 2. Sin filtros activos → solo orden alfabético
    if (this.filtrosActivos.size === 0) {
      return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // 3. Filtra por posición (auxiliar / soporte) — excluyente entre sí
    const filtrarTipo =
      this.filtrosActivos.has('auxiliar') ||
      this.filtrosActivos.has('soporte');

    if (filtrarTipo) {
      lista = lista.filter(e => {
        const esAux = e.posicion?.toUpperCase().includes('AUXILIAR');
        const esSop = e.posicion?.toUpperCase().includes('SOPORTE');
        return (
          (this.filtrosActivos.has('auxiliar') && esAux) ||
          (this.filtrosActivos.has('soporte')  && esSop)
        );
      });
    }

    // 4. Ordena por métricas: quien tiene menos asignaciones sube primero
      const score = (e: Empleado): number => {
        let s = 0;
        if (this.filtrosActivos.has('metro'))    s += this.getMetroSemana(e.id);
        if (this.filtrosActivos.has('interior')) s += this.getInteriorExteriorSemana(e.id);
        if (this.filtrosActivos.has('sede'))     s += this.getSedeSemana(e.id);
        return s;
      };

    return [...lista].sort((a, b) => {
      const diff = score(b) - score(a);
      return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
    });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPERS DEL TEMPLATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Genera la clave única para buscar en dataTemporal (ej: "42-2025-04-21") */
  generarLlave(id: number, fecha: Date): string {
    return `${id}-${fecha.toISOString().split('T')[0]}`;
  }

  /** Devuelve las clases CSS de color para una celda según su estado */
  getClaseColor(key: string, fecha: Date): string {
    const items        = this.dataTemporal[key] ?? [];
    const tieneOcupado = items.some(
      i => i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)
    );
    let clases = '';
    if (this.esDiaPasado(fecha)) clases += 'bg-dia-pasado ';
    if (tieneOcupado)            clases += 'bg-warning-subtle ';
    return clases;
  }

  /** Expande o colapsa el detalle de un chip en la vista */
  toggleChip(uid: string) {
    if (this.chipExpandido.has(uid)) {
      this.chipExpandido.delete(uid);
    } else {
      this.chipExpandido.add(uid);
    }
  }

  /** Devuelve true si la fecha es anterior a hoy */
  private esDiaPasado(fecha: Date): boolean {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f   = new Date(fecha); f.setHours(0, 0, 0, 0);
    return f < hoy;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PRIVADOS DE SOPORTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Convierte el formato de la API al formato interno AsignacionCelda */
  private mapearDesdeAPI(a: any): AsignacionCelda {
    return {
      uid:           `saved-${a.IdAsignacion}`,
      idAsignacion:  a.IdAsignacion,
      tipoId:        a.IdTipo                ?? 0,
      cantidad:      a.IdTipo !== 2          ? (a.CantidadAsignaciones?.toString() ?? '') : '',
      cantidadMetro: a.IdTipo === 2          ? (a.CantidadAsignaciones?.toString() ?? '') : '',
      dias:          a.DiasViaje?.toString() ?? '',
      zona:          a.ZonaGeografica        ?? '',
      idEstado:      a.idEstado              ?? 1,
      modificado:    false,
      guardadoOk:    false,
      esNueva:       false,
    };
  }

  /** Crea un objeto AsignacionCelda vacío para filas nuevas (aún no guardadas) */
  private nuevaCeldaVacia(): AsignacionCelda {
    this.uidCounter++;
    return {
      uid:           `new-${this.uidCounter}`,
      idAsignacion:  null,
      tipoId:        0,
      cantidad:      '',
      cantidadMetro: '',
      dias:          '',
      zona:          '',
      idEstado:      1,
      modificado:    false,
      guardadoOk:    false,
      esNueva:       true,
    };
  }

  /** Muestra el alert cuando el técnico ya tiene una asignación activa esta semana */
  private mostrarAlertaTecnicoOcupado(diaSemana: Date, asigOcupada: AsignacionCelda) {
    const nombreDia  = diaSemana.toLocaleDateString('es-DO', { weekday: 'long', day: '2-digit', month: 'short' });
    const nombreTipo = this.getNombreTipo(asigOcupada.tipoId);

    let detalle = '';
    if (asigOcupada.tipoId === 1 && asigOcupada.cantidad)
      detalle = ` · ${asigOcupada.cantidad} tareas`;
    else if (asigOcupada.tipoId === 2 && asigOcupada.cantidadMetro)
      detalle = ` · 🚇 ${asigOcupada.cantidadMetro} rutas`;
    else if ((asigOcupada.tipoId === 3 || asigOcupada.tipoId === 4) && asigOcupada.zona)
      detalle = ` · ${asigOcupada.dias}d — ${asigOcupada.zona}`;

    Swal.fire({
      icon:  'warning',
      title: 'Técnico ocupado',
      html: `
        <div style="font-size:0.9rem; line-height:1.8;">
          <div>Este técnico tiene una asignación activa:</div>
          <div class="mt-2">
            <span style="background:#fef3c7; padding:2px 8px; border-radius:4px; font-weight:600;">
              📅 ${nombreDia}
            </span>
          </div>
          <div class="mt-1">
            <span style="background:#fee2e2; padding:2px 8px; border-radius:4px; font-weight:600;">
              🗂️ ${nombreTipo}${detalle}
            </span>
          </div>
          <div class="mt-2 text-muted" style="font-size:0.78rem;">
            Libéralo primero para poder agregar una nueva asignación.
          </div>
        </div>
      `,
      confirmButtonText:  'Entendido',
      confirmButtonColor: '#2563eb',
    });
  }

}