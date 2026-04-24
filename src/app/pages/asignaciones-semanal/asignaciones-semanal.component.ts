import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empleado, TipoAsignacion, AsignacionCelda } from '../../interfaces/asignacion.interface';
import { EmpleadosService } from '../../services/empleados.service';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.scss'],
})
export class AsignacionesSemanalComponent implements OnInit {
  chipExpandido = new Set<string>();
  empleadosMaster: Empleado[] = [];
  loading = false;

  terminoBusqueda = '';
  diasSemana: Date[] = [];

  

  filtroActivo: string = 'ninguno';

  // Lunes de la semana que está en pantalla (se mueve con las flechas)
  private lunesActual!: Date;

  tipos: TipoAsignacion[] = [
    { idTipo: 1, nombre: 'Sede Central' },
    { idTipo: 2, nombre: 'Metro'        },
    { idTipo: 3, nombre: 'Interior'     },
    { idTipo: 4, nombre: 'Exterior'     },
  ];

  private readonly TIPOS_CON_LIMITE: number[] = [2, 3, 4];

  dataTemporal: Record<string, AsignacionCelda[]> = {};
  private uidCounter = 0;

  constructor(private _empleadosService: EmpleadosService) {}

  toggleChip(uid: string) {
  if (this.chipExpandido.has(uid)) {
    this.chipExpandido.delete(uid);
  } else {
    this.chipExpandido.add(uid);
  }
}

  ngOnInit() {
    this.irASemanaActual();
    this.cargarEmpleadosDeAPI();
  }

  // ─── NAVEGACIÓN DE SEMANA ──────────────────────────────────────

  /** Calcula el lunes de la semana que contiene "hoy" */
  private getLunesDe(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = d.getDay(); // 0=Dom, 1=Lun...
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Inicializa diasSemana a partir del lunes dado */
  private setSemana(lunes: Date) {
    this.lunesActual = new Date(lunes);
    this.diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  irASemanaActual() {
    this.setSemana(this.getLunesDe(new Date()));
  }

  /** +1 = siguiente semana, -1 = semana anterior */
  navegarSemana(direccion: 1 | -1) {
    const nuevoLunes = new Date(this.lunesActual);
    nuevoLunes.setDate(nuevoLunes.getDate() + direccion * 7);
    this.setSemana(nuevoLunes);
    this.recargarSemana();
  }

  esSemanaActual(): boolean {
    const lunesHoy = this.getLunesDe(new Date());
    return this.lunesActual.toISOString().split('T')[0] === lunesHoy.toISOString().split('T')[0];
  }

  // ─── CARGA ─────────────────────────────────────────────────────

  /** Recarga solo las asignaciones de la semana en pantalla (los empleados ya están cargados) */
  private recargarSemana() {
    this.loading = true;
    this.inicializarDataTemporal();
    this.cargarAsignacionesSemana();
  }

  cargarEmpleadosDeAPI() {
    this.loading = true;
    this._empleadosService.getEmpleadosActivos().subscribe({
      next: (data) => {
        this.empleadosMaster = data;
        this.empleadosMaster.forEach((emp) => {
          if (!emp.stats) emp.stats = { totalInterior: 0, metroMes: 0, totalSede: 0, diasNorte: 0, diasSur: 0, diasEste: 0 };
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

  private getRangoSemana() {
    return {
      inicio: this.diasSemana[0].toISOString().split('T')[0],
      fin:    this.diasSemana[6].toISOString().split('T')[0],
    };
  }

  private inicializarDataTemporal() {
    this.empleadosMaster.forEach((emp) => {
      this.diasSemana.forEach((dia) => {
        this.dataTemporal[this.generarLlave(emp.id, dia)] = [];
      });
    });
  }

  private cargarAsignacionesSemana() {
    const { inicio, fin } = this.getRangoSemana();
    this._empleadosService.getAsignacionesSemana(inicio, fin).subscribe({
      next: (res: any) => {
        const asignaciones: any[] = res.body ?? [];
        asignaciones.forEach((a) => {
          const key = `${a.IdEmpleado}-${a.Fecha}`;
          if (this.dataTemporal[key] !== undefined) {
            this.dataTemporal[key].push(this.mapearDesdeAPI(a));
          }
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar asignaciones:', err);
        this.loading = false;
      },
    });
  }

  private cargarHistorialDesdeBD() {
    this._empleadosService.getHistorialEmpleados().subscribe({
      next: (res: any) => {
        const rows: any[] = res.body ?? [];

        this.empleadosMaster.forEach((emp) => {
          if (emp.stats) {
            emp.stats.totalSede = 0; emp.stats.metroMes  = 0;
            emp.stats.diasNorte = 0; emp.stats.diasSur   = 0;
            emp.stats.diasEste  = 0; emp.stats.totalInterior = 0;
          }
        });

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

        this.empleadosMaster.forEach((emp) => {
          if (emp.stats) {
            emp.stats.totalInterior =
              (emp.stats.diasNorte || 0) + (emp.stats.diasSur || 0) + (emp.stats.diasEste || 0);
          }
        });
      },
      error: (err) => console.error('Error al cargar historial:', err),
    });
  }

  // ─── MAPEO ─────────────────────────────────────────────────────

  private mapearDesdeAPI(a: any): AsignacionCelda {
    return {
      uid:           `saved-${a.IdAsignacion}`,
      idAsignacion:  a.IdAsignacion,
      tipoId:        a.IdTipo         ?? 0,
      cantidad:      a.IdTipo !== 2   ? (a.CantidadTareas?.toString() ?? '') : '',
      cantidadMetro: a.IdTipo === 2   ? (a.CantidadTareas?.toString() ?? '') : '',
      dias:          a.DiasViaje?.toString()  ?? '',
      zona:          a.ZonaGeografica ?? '',
      idEstado:      a.idEstado       ?? 1,
      modificado:    false,
      guardadoOk:    false,
      esNueva:       false,
    };
  }

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

  // ─── TIPOS DISPONIBLES ─────────────────────────────────────────

  tiposDisponibles(empId: number, dia: Date, itemActual?: AsignacionCelda): TipoAsignacion[] {
    const key   = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];

    const tiposLimitadosUsados = new Set(
      items
        .filter(i => !i.esNueva && i.uid !== itemActual?.uid && this.TIPOS_CON_LIMITE.includes(i.tipoId))
        .map(i => i.tipoId)
    );

    return this.tipos.filter(t => {
      if (!this.TIPOS_CON_LIMITE.includes(t.idTipo)) return true;
      return !tiposLimitadosUsados.has(t.idTipo);
    });
  }

  // ─── AGREGAR ───────────────────────────────────────────────────

  agregarAsignacion(empId: number, dia: Date) {
  const key   = this.generarLlave(empId, dia);
  const items = this.dataTemporal[key] ?? [];


  // ─── VALIDACIÓN: revisar TODA la semana ───────────────────────
  for (const diaSemana of this.diasSemana) {
    const keySemana    = this.generarLlave(empId, diaSemana);
    const itemsSemana  = this.dataTemporal[keySemana] ?? [];
    const asigOcupada  = itemsSemana.find(
      i => !i.esNueva && i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)
    );

    if (asigOcupada) {
      const nombreDia  = diaSemana.toLocaleDateString('es-DO', { weekday: 'long', day: '2-digit', month: 'short' });
      const nombreTipo = this.getNombreTipo(asigOcupada.tipoId);

      // Construir detalle extra según el tipo
      let detalle = '';
      if (asigOcupada.tipoId === 1 && asigOcupada.cantidad)
        detalle = ` · ${asigOcupada.cantidad} tareas`;
      else if (asigOcupada.tipoId === 2 && asigOcupada.cantidadMetro)
        detalle = ` · 🚇 ${asigOcupada.cantidadMetro} rutas`;
      else if ((asigOcupada.tipoId === 3 || asigOcupada.tipoId === 4) && asigOcupada.zona)
        detalle = ` · ${asigOcupada.dias}d — ${asigOcupada.zona}`;

      Swal.fire({
        icon: 'warning',
        title: 'Técnico ocupado',
        html: `
          <div style="font-size: 0.9rem; line-height: 1.8;">
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
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb',
      });
      return;
    }
  }
  // ──────────────────────────────────────────────────────────────

  const tiposLimitadosGuardados = items
    .filter(i => !i.esNueva && this.TIPOS_CON_LIMITE.includes(i.tipoId))
    .map(i => i.tipoId);

  const todosLimitadosUsados = this.TIPOS_CON_LIMITE.every(t =>
    tiposLimitadosGuardados.includes(t)
  );

  if (todosLimitadosUsados && this.tiposDisponibles(empId, dia).length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Todos los tipos asignados',
      text: 'Este técnico ya tiene todos los tipos cubiertos para este día.',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  this.dataTemporal[key].push(this.nuevaCeldaVacia());
}

  // ─── GUARDAR ───────────────────────────────────────────────────

  guardarCelda(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item || item.tipoId === 0) return;

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
          showConfirmButton: false
        });
        return;
      }
    }

    const fechaStr      = dia.toISOString().split('T')[0];
    const cantidadFinal = item.tipoId === 2 ? item.cantidadMetro : item.cantidad;

    const payload = {
      idEmpleado:     empId,
      fecha:          fechaStr,
      idTipo:         item.tipoId,
      cantidadTareas: cantidadFinal || null,
      diasViaje:      item.dias     || null,
      zonaGeografica: item.zona     || null,
      idEstado:       item.idEstado ?? 1,
      observaciones:  null,
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
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: 'Revisa tu conexión e intenta de nuevo.', timer: 3000, showConfirmButton: false });
      }
    });
  }

  // ─── ELIMINAR ──────────────────────────────────────────────────

  eliminarAsignacion(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    Swal.fire({
      title: '¿Eliminar asignación?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (item.idAsignacion) {
        this._empleadosService.eliminarAsignacion(item.idAsignacion).subscribe({
          next: () => {
            this.dataTemporal[key].splice(index, 1);
            this.cargarHistorialDesdeBD();
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la asignación' })
        });
      } else {
        this.dataTemporal[key].splice(index, 1);
      }
    });
  }

  // ─── ESTADO ────────────────────────────────────────────────────

  marcarComoDisponible(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
    item.idEstado = 3;
    if (!item.idAsignacion) return;
    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 3).subscribe({
      error: () => {
        item.idEstado = 1;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo liberar al técnico.', timer: 3000, showConfirmButton: false });
      }
    });
  }

  marcarComoOcupado(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
     if (item.tipoId === 1) return;

  item.idEstado = 1;
    item.idEstado = 1;
    if (!item.idAsignacion) return;
    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 1).subscribe({
      error: () => {
        item.idEstado = 3;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo marcar como ocupado.', timer: 3000, showConfirmButton: false });
      }
    });
  }

  empleadoEstaOcupado(empId: number): boolean {
    return this.diasSemana.some((dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      return items.some(i => i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId));
    });
  }

  // ─── COLOR ─────────────────────────────────────────────────────

  getClaseColor(key: string, fecha: Date): string {
    const items = this.dataTemporal[key] ?? [];
    const tieneOcupado = items.some(
      i => i.idEstado !== 3 && this.TIPOS_CON_LIMITE.includes(i.tipoId)
    );
    let clases = '';
    if (this.esDiaPasado(fecha)) clases += 'bg-dia-pasado ';
    if (tieneOcupado)            clases += 'bg-warning-subtle ';
    return clases;
  }

  getNombreTipo(tipoId: number): string {
    return this.tipos.find(t => t.idTipo === tipoId)?.nombre ?? '';
  }

  // ─── HELPERS ───────────────────────────────────────────────────

  generarLlave(id: number, fecha: Date): string {
    return `${id}-${fecha.toISOString().split('T')[0]}`;
  }

  ordenarListaAlfabeticamente() {
    this.empleadosMaster.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  
 
setFiltro(filtro: string) {
  this.filtroActivo = filtro;
}

  filtrarEmpleados(): Empleado[] {

  const b = this.terminoBusqueda.toLowerCase();

  // 🔥 1. FILTRAS NORMAL
  let lista = this.empleadosMaster.filter(e =>
    e.nombre.toLowerCase().includes(b) ||
    e.localidad?.toLowerCase().includes(b) ||
    e.codigo.includes(b)
  );

  // 🔥 2. CLONAS PARA NO MUTAR EL ORIGINAL
  lista = [...lista];

  // 🔥 3. HELPERS (evita repetir lógica)
  const esAux = (e: Empleado) =>
    e.posicion?.toUpperCase().includes('AUXILIAR') ? 1 : 0;

  const esSoporte = (e: Empleado) =>
    e.posicion?.toUpperCase().includes('SOPORTE') ? 1 : 0;

  switch (this.filtroActivo) {

    case 'auxiliar':
  lista.sort((a, b) => {
    const aVal = esAux(a) ? 0 : 1;
    const bVal = esAux(b) ? 0 : 1;
    return aVal - bVal;
  });
  break;

    case 'soporte':
      lista.sort((a, b) => {
        const aVal = esSoporte(a) ? 0 : 1;
        const bVal = esSoporte(b) ? 0 : 1;
        return aVal - bVal;
      });
      break;

    case 'metro':
  lista.sort((a, b) => {
    const aVal = a.stats.metroMes ?? 0;
    const bVal = b.stats.metroMes ?? 0;

    // prioridad principal (menos primero)
    const diff = aVal - bVal;

    // desempate → nombre
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
  });
  break;

case 'interior':
  lista.sort((a, b) => {
    const aVal = a.stats.totalInterior ?? 0;
    const bVal = b.stats.totalInterior ?? 0;

    const diff = aVal - bVal;
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
  });
  break;

case 'sede':
  lista.sort((a, b) => {
    const aVal = a.stats.totalSede ?? 0;
    const bVal = b.stats.totalSede ?? 0;

    const diff = aVal - bVal;
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
  });
  break;

    default:
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
  }

  return lista;
}

  private esDiaPasado(fecha: Date): boolean {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f   = new Date(fecha); f.setHours(0, 0, 0, 0);
    return f < hoy;
  }

  marcarModificado(item: AsignacionCelda) {
    item.modificado = true;
  }

  limpiarTelefono(numero: string): string {
  return numero.replace(/\D/g, '');
}
}