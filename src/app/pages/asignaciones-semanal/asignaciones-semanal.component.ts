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
        this.cargarHistorialDesdeBD();
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.loading = false;
      },
    });
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
        console.error('Error al cargar asignaciones de la semana:', err);
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

  // ─── TIPOS DISPONIBLES PARA AGREGAR EN UNA CELDA ──────────────
  // Devuelve solo los tipos que aún no existen en esa celda (máx 1 por tipo por día)
  tiposDisponibles(empId: number, dia: Date): TipoAsignacion[] {
    const key   = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];
    // tiposId ya usados (incluyendo los formularios nuevos pendientes)
    const usados = new Set(items.map(i => i.tipoId));
    return this.tipos.filter(t => !usados.has(t.idTipo));
  }

  // ─── AGREGAR / GUARDAR / ELIMINAR ──────────────────────────────

  agregarAsignacion(empId: number, dia: Date) {
    const disponibles = this.tiposDisponibles(empId, dia);
    if (disponibles.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Todos los tipos asignados',
        text: 'Este técnico ya tiene los 4 tipos cubiertos para este día.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }
    const key = this.generarLlave(empId, dia);
    this.dataTemporal[key].push(this.nuevaCeldaVacia());
  }

  guardarCelda(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item || item.tipoId === 0) return;

    // ─── VALIDACIÓN DUPLICADO: no permitir mismo tipo ya guardado ─
    const duplicado = this.dataTemporal[key].some(
      (i, idx) => idx !== index && i.tipoId === item.tipoId && !i.esNueva
    );
    if (duplicado) {
      Swal.fire({
        icon: 'warning',
        title: 'Tipo duplicado',
        text: `Ya existe una asignación de tipo "${this.getNombreTipo(item.tipoId)}" para este día.`,
        timer: 2500,
        showConfirmButton: false
      });
      return;
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
      if (result.isConfirmed) {
        if (item.idAsignacion) {
          this._empleadosService.eliminarAsignacion(item.idAsignacion).subscribe({
            next: () => {
              this.dataTemporal[key].splice(index, 1);
              this.cargarHistorialDesdeBD();
              Swal.fire({ icon: 'success', title: 'Eliminado', text: 'La asignación fue eliminada correctamente', timer: 1500, showConfirmButton: false });
            },
            error: (err) => {
              console.error('Error al eliminar:', err);
              Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la asignación' });
            }
          });
        } else {
          this.dataTemporal[key].splice(index, 1);
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Asignación eliminada localmente', timer: 1200, showConfirmButton: false });
        }
      }
    });
  }

  // ─── ESTADO ────────────────────────────────────────────────────

  marcarComoDisponible(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
    if (!item.idAsignacion) { item.idEstado = 3; return; }
    item.idEstado = 3;
    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 3).subscribe({
      error: (err) => {
        console.error('Error al liberar técnico:', err);
        item.idEstado = 1;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo liberar al técnico.', timer: 3000, showConfirmButton: false });
      }
    });
  }

  marcarComoOcupado(empId: number, dia: Date, index: number) {
    const key  = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
    if (!item.idAsignacion) { item.idEstado = 1; return; }
    item.idEstado = 1;
    this._empleadosService.actualizarEstadoAsignacion(item.idAsignacion, 1).subscribe({
      error: (err) => {
        console.error('Error al marcar ocupado:', err);
        item.idEstado = 3;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo marcar como ocupado.', timer: 3000, showConfirmButton: false });
      }
    });
  }

  // ─── ESTADO DE LA FILA COMPLETA ────────────────────────────────

  /** True si el técnico tiene AL MENOS UNA asignación activa (idEstado !== 3) en CUALQUIER día de la semana */
  empleadoEstaOcupado(empId: number): boolean {
    return this.diasSemana.some((dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      return items.some(i => i.idEstado !== 3 && i.tipoId !== 0 && i.tipoId !== 1);
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