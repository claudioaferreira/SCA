import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empleado, TipoAsignacion, AsignacionCelda } from '../../interfaces/asignacion.interface';
import { EmpleadosService } from '../../services/empleados.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, HttpClientModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.scss'],
})
export class AsignacionesSemanalComponent implements OnInit {

  empleadosMaster: Empleado[] = [];
  loading = false;

  terminoBusqueda = '';
  diasSemana: Date[] = [];

  tipos: TipoAsignacion[] = [
    { idTipo: 1, nombre: 'Sede Central' },
    { idTipo: 2, nombre: 'Metro'        },
    { idTipo: 3, nombre: 'Interior'     },
    { idTipo: 4, nombre: 'Exterior'     },
  ];

  // NUEVO MODELO: cada clave tiene un ARRAY de asignaciones
  // dataTemporal['empId-fecha'] = [ AsignacionCelda, AsignacionCelda, ... ]
  dataTemporal: Record<string, AsignacionCelda[]> = {};

  constructor(private _empleadosService: EmpleadosService) {}

  ngOnInit() {
    this.generarCalendarioSemanal();
    this.cargarEmpleadosDeAPI();
  }

  // ─── CALENDARIO ────────────────────────────────────────────────

  generarCalendarioSemanal() {
    const hoy = new Date();
    const lunes = new Date(
      hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1))
    );
    this.diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  private getRangoSemana() {
    return {
      inicio: this.diasSemana[0].toISOString().split('T')[0],
      fin:    this.diasSemana[6].toISOString().split('T')[0],
    };
  }

  // ─── CARGA INICIAL ─────────────────────────────────────────────

  cargarEmpleadosDeAPI() {
    this.loading = true;
    this._empleadosService.getEmpleados().subscribe({
      next: (data) => {
        this.empleadosMaster = data;
        this.empleadosMaster.forEach((emp) => {
          if (!emp.stats) emp.stats = { totalInterior: 0, metroMes: 0, totalSede: 0, diasNorte: 0, diasSur: 0, diasEste: 0 };
        });
        this.ordenarListaAlfabeticamente();
        this.inicializarDataTemporal();
        this.cargarAsignacionesSemana();
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.loading = false;
      },
    });
  }

  /** Inicializa cada clave con un array vacío */
  private inicializarDataTemporal() {
    this.empleadosMaster.forEach((emp) => {
      this.diasSemana.forEach((dia) => {
        this.dataTemporal[this.generarLlave(emp.id, dia)] = [];
      });
    });
  }

  /** Hidrata dataTemporal con los registros reales de la BD */
  private cargarAsignacionesSemana() {
    const { inicio, fin } = this.getRangoSemana();
    this._empleadosService.getAsignacionesSemana(inicio, fin).subscribe({
      next: (res: any) => {
        const asignaciones: any[] = res.body ?? [];
        asignaciones.forEach((a) => {
          const key = `${a.IdEmpleado}-${a.Fecha}`;
          if (this.dataTemporal[key] !== undefined) {
            this.dataTemporal[key].push(this.mapearDesdeAPI(a));
            this.recalcularStats(a.IdEmpleado);
          }
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar asignaciones de la semana:', err);
        this.loading = false;
      },
    });
  }

  private mapearDesdeAPI(a: any): AsignacionCelda {
    return {
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
    return {
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

  // ─── AGREGAR / GUARDAR / ELIMINAR ──────────────────────────────

  /** Abre un nuevo formulario vacío en la celda */
  agregarAsignacion(empId: number, dia: Date) {
    const key = this.generarLlave(empId, dia);
    this.dataTemporal[key].push(this.nuevaCeldaVacia());
  }

  /** Guarda (INSERT) una asignación nueva en la BD */
  guardarCelda(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item || item.tipoId === 0) return;

    const fechaStr      = key.substring(key.indexOf('-') + 1);
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
        // Guardamos el IdAsignacion que devuelve el backend (OUTPUT INSERTED)
        item.idAsignacion = res.body?.idAsignacion ?? null;
        item.modificado   = false;
        item.esNueva      = false;
        item.guardadoOk   = true;

        this.recalcularStats(empId);

        setTimeout(() => { item.guardadoOk = false; }, 2000);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Error al guardar. Revisa tu conexión e intenta de nuevo.');
      }
    });
  }

  /** Elimina una asignación (de la BD si ya fue guardada, o solo del array si es nueva) */
  eliminarAsignacion(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (item.idAsignacion) {
      // Ya está en la BD → llamamos al DELETE
      this._empleadosService.eliminarAsignacion(item.idAsignacion).subscribe({
        next: () => {
          this.dataTemporal[key].splice(index, 1);
          this.recalcularStats(empId);
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar. Intenta de nuevo.');
        }
      });
    } else {
      // Aún no está en la BD → solo quitamos del array local
      this.dataTemporal[key].splice(index, 1);
    }
  }

  // ─── ESTADO (OCUPADO / DISPONIBLE) ─────────────────────────────

  /**
   * Libera al técnico marcando esa asignación como Completada (idEstado=3).
   * No toca las demás asignaciones del mismo día.
   * Después de liberar, puede seguir agregando nuevas asignaciones.
   */
  marcarComoDisponible(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item.idAsignacion) {
      // Si no está en BD todavía, solo cambiamos el estado local
      item.idEstado = 3;
      return;
    }

    // Optimistic update
    item.idEstado = 3;

    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 3).subscribe({
      error: (err) => {
        console.error('Error al liberar técnico:', err);
        item.idEstado = 1; // revertimos
        alert('Error al liberar el técnico. Intenta de nuevo.');
      }
    });
  }

  /** Vuelve a marcar como Ocupado (permite editar o re-asignar) */
  marcarComoOcupado(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item.idAsignacion) {
      item.idEstado = 1;
      return;
    }

    item.idEstado = 1;

    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 1).subscribe({
      error: (err) => {
        console.error('Error al marcar ocupado:', err);
        item.idEstado = 3;
        alert('Error al actualizar el estado. Intenta de nuevo.');
      }
    });
  }

  // ─── GUARDAR TODO ──────────────────────────────────────────────

  guardarTodo() {
    let pendientes = 0;
    this.empleadosMaster.forEach((emp) => {
      this.diasSemana.forEach((dia) => {
        const key = this.generarLlave(emp.id, dia);
        this.dataTemporal[key].forEach((item, index) => {
          if (item.esNueva && item.tipoId !== 0) {
            pendientes++;
            this.guardarCelda(emp.id, dia, index);
          }
        });
      });
    });
    if (pendientes === 0) alert('No hay asignaciones nuevas pendientes de guardar.');
  }

  // ─── COLOR DE CELDA ────────────────────────────────────────────

  /** El color de la celda se basa en si hay alguna asignación activa (idEstado !== 3) */
  getClaseColor(key: string, fecha: Date): string {
    const items = this.dataTemporal[key] ?? [];
    const tieneOcupado = items.some(i => i.idEstado !== 3 && i.tipoId !== 0 && (i.tipoId === 2 || i.tipoId === 3 || i.tipoId === 4));

    let clases = '';
    if (this.esDiaPasado(fecha))  clases += 'bg-dia-pasado ';
    if (tieneOcupado)             clases += 'bg-warning-subtle ';
    return clases;
  }

  getNombreTipo(tipoId: number): string {
    return this.tipos.find(t => t.idTipo === tipoId)?.nombre ?? '';
  }

  // ─── STATS ─────────────────────────────────────────────────────

  recalcularStats(empId: number) {
    const emp = this.empleadosMaster.find(e => e.id === empId);
    if (!emp?.stats) return;

    const s = emp.stats;
    s.totalSede = 0; s.metroMes = 0;
    s.diasNorte = 0; s.diasSur  = 0; s.diasEste = 0;

    this.diasSemana.forEach((dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      items.forEach((data) => {
        if (data.tipoId === 1 && data.cantidad)      s.totalSede!++;
        if (data.tipoId === 2 && data.cantidadMetro) s.metroMes = (s.metroMes || 0) + (Number(data.cantidadMetro) || 0);
        if (data.tipoId === 3 && data.dias && data.zona) {
          const n = parseInt(data.dias) || 0;
          if (data.zona === 'Norte') s.diasNorte = (s.diasNorte || 0) + n;
          if (data.zona === 'Sur')   s.diasSur   = (s.diasSur   || 0) + n;
          if (data.zona === 'Este')  s.diasEste  = (s.diasEste  || 0) + n;
        }
      });
    });

    s.totalInterior = (s.diasNorte || 0) + (s.diasSur || 0) + (s.diasEste || 0);
  }

  // ─── HELPERS ───────────────────────────────────────────────────

  generarLlave(id: number, fecha: Date): string {
    return `${id}-${fecha.toISOString().split('T')[0]}`;
  }

  ordenarListaAlfabeticamente() {
    this.empleadosMaster.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  filtrarEmpleados(): Empleado[] {
    const b = this.terminoBusqueda.toLowerCase();
    return this.empleadosMaster.filter(e =>
      e.nombre.toLowerCase().includes(b) ||
      e.localidad.toLowerCase().includes(b) ||
      e.codigo.includes(b)
    );
  }

  private esDiaPasado(fecha: Date): boolean {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f   = new Date(fecha); f.setHours(0, 0, 0, 0);
    return f < hoy;
  }

  marcarModificado(item: AsignacionCelda) {
    item.modificado = true;
  }
}