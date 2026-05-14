import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import {
  Empleado,
  TipoAsignacion,
  AsignacionCelda,
  ZonaGeo,
  CentroCedulacion,
  RutaCentro,
} from '../../interfaces/asignacion.interface';
import { EmpleadosService } from '../../services/empleados.service';

import {
  alertaTecnicoOcupado,
  alertaTodosLosTiposAsignados,
  confirmarEliminarAsignacion,
  alertaErrorGuardar,
  alertaTipoDuplicado,
} from './alertas-asignacion.helper';
import { GestionHumanaService } from '../../services/gestion-humana.service';
import { CatalogosService } from '../../services/catalogos.service';

@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NgSelectModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.scss'],
})
export class AsignacionesSemanalComponent implements OnInit {

  
    // ---- INJECCIÓN DE SERVICIOS ----
  private ghService = inject(GestionHumanaService);
  private _catalogosService = inject(CatalogosService);
  private _empleadosService = inject(EmpleadosService);
  // ─── ESTADO GENERAL ─────────────────────────────────────────────────────
  popoverAbierto: number | null = null;
  loading = false;
  diasSemana: Date[] = [];
  private lunesActual!: Date;

  ausenciasMap = new Map<string, any>(); // clave: "empId-YYYY-MM-DD"
  tardanzasMap = new Map<string, any>(); // clave: "empId-YYYY-MM-DD"

  // ─── EMPLEADOS ──────────────────────────────────────────────────────────

  empleadosMaster: Empleado[] = [];
  zonasGeo: ZonaGeo[] = [];
  centrosCedulacion: CentroCedulacion[] = [];

  // ─── TIPOS DE ASIGNACIÓN ────────────────────────────────────────────────

  tipos: TipoAsignacion[] = [];

  /**
   * Tipos que bloquean al técnico toda la semana.
   * Metro (2), Interior (3) y Exterior (4) solo se pueden asignar una vez.
   * Sede Central (1) NO bloquea — el técnico puede tener sede y otro tipo.
   */
  private tiposConLimiteIds: number[] = [];

  // ─── ASIGNACIONES (CELDAS) ──────────────────────────────────────────────

  dataTemporal: Record<string, AsignacionCelda[]> = {};
  private uidCounter = 0;
  chipExpandido = new Set<string>();

  // ─── BÚSQUEDA Y FILTROS ─────────────────────────────────────────────────

  terminoBusqueda = '';
  filtrosActivos = new Set<string>();

  // @deprecated — usar filtrosActivos en su lugar
  // filtroActivo: string = 'ninguno';

  // ─── RANKING DE APTITUD (cache) ───────────────────────────────────
  rankingMap = new Map<string, number>();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CICLO DE VIDA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ngOnInit() {
    this.irASemanaActual();
    this.obtenerTiposAsignaciones(); // catálogo primero, no depende de nada
    this.cargarZonasGeo();
    this.cargarEmpleadosDeAPI(); // empleados + asignaciones + historial
    this.cargarCentrosCedulacion();
    this.cargarAusenciasSemana();
    this.cargarRanking();
  }

  cargarRanking(): void {
    const anioActual = new Date().getFullYear();
    const inicio = `${anioActual}-01-01`;
    const fin = `${anioActual}-12-31`;

    this._empleadosService.getRankingDisponibilidad(inicio, fin).subscribe({
      next: (res) => {
        this.rankingMap.clear();
        (res.body ?? []).forEach((r: any) => {
          this.rankingMap.set(r.Codigo, r.ScoreDisponibilidad);
        });
      },
      error: () => {
        /* silencioso */
      },
    });
  }

  /** Devuelve el nivel del empleado: 'top' | 'mid' | 'low' | null */
  getNivelRanking(codigo: string): 'top' | 'mid' | 'low' | null {
    const score = this.rankingMap.get(codigo);
    if (score === undefined) return null;
    if (score > 85) return 'top';
    if (score > 70) return 'mid';
    return 'low';
  }

  /** Devuelve el score del empleado para mostrar como badge (opcional) */
  getScoreRanking(codigo: string): number | null {
    return this.rankingMap.get(codigo) ?? null;
  }

  buscadorPersonalizado(term: string, item: any) {
    term = term.toLowerCase();
    // Busca coincidencias tanto en el nombre del Centro como en la Zona
    return (
      item.Centro.toLowerCase().includes(term) ||
      item.ZonaGeo.toLowerCase().includes(term)
    );
  }

  cargarAusenciasSemana(): void {
    const { inicio, fin } = this.getRangoSemana();
    this.ausenciasMap.clear();
    this.tardanzasMap.clear();

    // 1) AUSENCIAS (Permiso · Licencia · Vacaciones)
   this.ghService.getAusenciasRango(inicio, fin).subscribe({
  next: (res) => {
    const ausencias = res.body ?? [];
    ausencias.forEach((a: any) => {
      // Detecta si la fila es una tardanza / incidencia.
      // El técnico SÍ vino (aunque tarde), así que no debe bloquear la celda.
      const tipoStr = (a?.TipoAusencia ?? '').toLowerCase();
      const esTardanza =
        !a?.BloqueaAsignacion ||
        tipoStr.includes('tardanza') ||
        tipoStr.includes('incidencia');

      const desde = this.parsearFechaLocal(a.FechaInicio);

      if (esTardanza) {
        // Las tardanzas solo aplican al día indicado (FechaReintegro puede venir null).
        const key = `${a.IdEmpleado}-${this.fechaLocalISO(desde)}`;
        this.tardanzasMap.set(key, { ...a, tipo: 'tardanza' });
        return;
      }

      // FechaReintegro = día en que el empleado REGRESA al trabajo (exclusivo).
      const hasta = this.parsearFechaLocal(a.FechaReintegro);
      for (
        let d = new Date(desde);
        d < hasta;
        d.setDate(d.getDate() + 1)
      ) {
        const key = `${a.IdEmpleado}-${this.fechaLocalISO(d)}`;
        this.ausenciasMap.set(key, { ...a, tipo: 'ausencia' });
      }
    });
  },
});

    // 2) BLOQUEOS MANUALES (override del supervisor)
    this.ghService.getBloqueosManualesRango(inicio, fin).subscribe({
      next: (res) => {
        const bloqueos = res.body ?? [];
        bloqueos.forEach((b: any) => {
          const desde = this.parsearFechaLocal(b.FechaInicio);
          const hasta = this.parsearFechaLocal(b.FechaFin);
          for (
            let d = new Date(desde);
            d <= hasta;
            d.setDate(d.getDate() + 1)
          ) {
            const key = `${b.IdEmpleado}-${this.fechaLocalISO(d)}`;
            // Si ya hay ausencia (vacaciones/licencia/permiso), NO la sobreescribimos.
            // Las ausencias formales tienen prioridad visual sobre el bloqueo manual.
            if (!this.ausenciasMap.has(key)) {
              this.ausenciasMap.set(key, {
                tipo: 'manual',
                IdEstadoManual: b.IdEstadoManual,
                Motivo: b.Motivo,
                FechaInicio: b.FechaInicio,
                FechaFin: b.FechaFin,
                TipoAusencia: 'Bloqueo manual',
              });
            }
          }
        });
      },
    });

    // 3) CUMPLEAÑOS (Calculado en vivo desde la lista de empleados)
    if (this.empleadosMaster && this.empleadosMaster.length > 0) {
      this.empleadosMaster.forEach((emp: any) => {
        // 👇 Buscamos la fecha sin importar si llega con mayúscula o minúscula
        const fechaNac = emp.FechaNacimiento || emp.fechaNacimiento;

        if (fechaNac) {
          // Extraemos mes y día
          const partes = fechaNac.split('T')[0].split('-');
          const mesNac = parseInt(partes[1], 10);
          const diaNac = parseInt(partes[2], 10);

          this.diasSemana.forEach((dia) => {
            if (dia.getMonth() + 1 === mesNac && dia.getDate() === diaNac) {
              const key = `${emp.id}-${this.fechaLocalISO(dia)}`;

              if (!this.ausenciasMap.has(key)) {
                this.ausenciasMap.set(key, {
                  tipo: 'cumpleanos',
                  TipoAusencia: 'Cumpleaños',
                  FechaInicio: this.fechaLocalISO(dia),
                  FechaReintegro: this.fechaLocalISO(dia),
                });
              }
            }
          });
        } else {
          // ⚠️ Si entra aquí, significa que tu backend NO está enviando la fecha
          console.warn(`Sin fecha de nacimiento detectada para: ${emp.nombre}`);
        }
      });
    }
  }

  tieneAusencia(empId: number, dia: Date): any | null {
    const key = `${empId}-${this.fechaLocalISO(dia)}`;
    return this.ausenciasMap.get(key) ?? null;
  }

  tieneTardanza(empId: number, dia: Date): any | null {
  const key = `${empId}-${this.fechaLocalISO(dia)}`;
  return this.tardanzasMap.get(key) ?? null;
}

nombreCortoIncidencia(tipoAusencia: string | undefined): string {
  if (!tipoAusencia) return 'Inc.';
  const partes = tipoAusencia.split('·').map((s) => s.trim());
  return partes[partes.length - 1] || tipoAusencia;
}

  copiarDatosTecnico(emp: any) {
    const texto = `Nombre: ${emp.nombre} | Código: ${emp.codigo} | Cargo: ${emp.cargo} | Tel. Flota: ${emp.telefonoFlota || 'N/A'} | Tel. Personal: ${emp.telefonoPersonal || 'N/A'}`;
    navigator.clipboard.writeText(texto);
    // - PENDIENTE mostrar un SWEETALERT de confirmación
  }

  cargarCentrosCedulacion() {
    this._catalogosService.getCentrosCedulacion().subscribe({
      next: (res: any) => {
        this.centrosCedulacion = res.body ?? [];
      },
      error: (err) => console.error('Error al cargar centros:', err),
    });
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
    this.cargarAusenciasSemana();
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
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Rellena diasSemana[] con los 7 días a partir del lunes dado */
  private setSemana(lunes: Date) {
    this.lunesActual = new Date(lunes);
    this.diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  /** Devuelve las fechas de inicio y fin de la semana visible */
  private getRangoSemana() {
    return {
      inicio: this.fechaLocalISO(this.diasSemana[0]),
      fin: this.fechaLocalISO(this.diasSemana[6]),
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  TIPOS DE ASIGNACIÓN / ZONAS GEOGRÁFICAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET /api/asignaciones/zonageo
  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/asignaciones/tipoasignaciones
  // Trae el catálogo de tipos (Sede, Metro, Interior, Exterior).
  // Se llama una sola vez al abrir el componente.
  // ─────────────────────────────────────────────────────────────────────────

  cargarZonasGeo() {
    this._catalogosService.getZonasGeo().subscribe({
      next: (res: any) => {
        this.zonasGeo = res.body ?? [];
      },
      error: (err) => console.error('Error al cargar zonas geográficas', err),
    });
  }

  obtenerTiposAsignaciones() {
  this._catalogosService.getTiposAsignacion().subscribe({
    next: (res: any) => {
      this.tipos = res.body ?? [];

      // ✅ Se deriva de la BD, sin hardcodear nada
      this.tiposConLimiteIds = this.tipos
        .filter(t => t.BloqueaEmpleado)
        .map(t => t.IdTipo);
    },
    error: (err) => console.error('Error al cargar tipos:', err),
  });
}
  /** Devuelve el nombre del tipo según su ID (ej: 2 → 'Metro') */
  getNombreTipo(tipoId: number): string {
    const nombre = this.tipos.find((t) => t.IdTipo === tipoId)?.nombre ?? '';
    return nombre.substring(0, 2).toUpperCase();
  }

  /**
   * Devuelve los tipos que aún puede elegir el técnico en ese día.
   * Excluye los tipos con límite que ya están guardados.
   */
  tiposDisponibles(
    empId: number,
    dia: Date,
    itemActual?: AsignacionCelda,
  ): TipoAsignacion[] {
    const key = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];

    const tiposYaUsados = new Set(
      items
        .filter(
          (i) =>
            !i.esNueva &&
            i.uid !== itemActual?.uid &&
            this.tiposConLimiteIds.includes(i.tipoId),
        )
        .map((i) => i.tipoId),
    );

    return this.tipos.filter((t) => {
      if (!this.tiposConLimiteIds.includes(t.IdTipo)) return true;
      return !tiposYaUsados.has(t.IdTipo);
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━══
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
            totalInteriorSemana: 0,
          };
        });

        this.ordenarListaAlfabeticamente();
        this.inicializarDataTemporal();
        this.cargarAsignacionesSemana();
        this.cargarHistorialDesdeBD();
        this.cargarAusenciasSemana();
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
      return items.some(
        (i) => i.idEstado !== 3 && this.tiposConLimiteIds.includes(i.tipoId),
      );
    });
  }

  /** Convierte el nombre completo de la posición a una versión corta */
  abreviarPosicion(cargo: string | undefined): string {
    if (!cargo) return 'Soporte';
    return cargo
      .replace(/Soporte Tecnico III/gi, 'SOPORTE III')
      .replace(/Soporte Tecnico II/gi, 'SOPORTE II')
      .replace(/Soporte Tecnico I/gi, 'SOPORTE I')
      .replace(/Soporte Tecnico/gi, 'SOPORTE')
      .replace(/Auxiliar/gi, 'AUX.')
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
            emp.stats.totalSede = 0;
            emp.stats.metroMes = 0;
            emp.stats.diasNorte = 0;
            emp.stats.diasSur = 0;
            emp.stats.diasEste = 0;
            emp.stats.totalInterior = 0;
          }
        });

        // Acumula por empleado según el tipo de asignación
        rows.forEach((row) => {
          const emp = this.empleadosMaster.find((e) => e.id === row.IdEmpleado);
          if (!emp?.stats) return;

          const cantidad = Number(row.TotalCantidad) || 0;
          const dias = Number(row.TotalDias) || 0;

          switch (row.IdTipo) {
            case 1:
              emp.stats.totalSede = (emp.stats.totalSede || 0) + cantidad;
              break;
            case 2:
              emp.stats.metroMes = (emp.stats.metroMes || 0) + cantidad;
              break;
            case 3:
              if (row.ZonaGeografica === 'Norte')
                emp.stats.diasNorte = (emp.stats.diasNorte || 0) + dias;
              if (row.ZonaGeografica === 'Sur')
                emp.stats.diasSur = (emp.stats.diasSur || 0) + dias;
              if (row.ZonaGeografica === 'Este')
                emp.stats.diasEste = (emp.stats.diasEste || 0) + dias;
              break;
          }
        });

        // totalInterior = suma de los tres zonas
        this.empleadosMaster.forEach((emp) => {
          if (emp.stats) {
            emp.stats.totalInterior =
              (emp.stats.diasNorte || 0) +
              (emp.stats.diasSur || 0) +
              (emp.stats.diasEste || 0);
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
          const celda = this.mapearDesdeAPI(a);

          // Rango real: usa FechaInicio/FechaFin si existe (rutas), si no usa Fecha
          const desdeStr =
            (a.FechaInicio as string | null)?.substring(0, 10) ??
            (a.Fecha as string).substring(0, 10);
          const hastaStr =
            (a.FechaFinalizacion as string | null)?.substring(0, 10) ??
            (a.Fecha as string).substring(0, 10);

          // Marca cada día de la semana visible que caiga en el rango
          this.diasSemana.forEach((diaSemana) => {
            const diaStr = this.fechaLocalISO(diaSemana);

            if (diaStr >= desdeStr && diaStr <= hastaStr) {
              const key = `${a.IdEmpleado}-${diaStr}`;
              if (this.dataTemporal[key] !== undefined) {
                const yaExiste = this.dataTemporal[key].some(
                  (i) => i.idAsignacion === celda.idAsignacion,
                );
                if (!yaExiste) {
                  this.dataTemporal[key].push(celda);
                }
              }
            }
          });
        });

        this.loading = false;
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
        .filter((i) => !i.esNueva && i.tipoId === 1)
        .reduce((sum, i) => sum + (Number(i.cantidad) || 1), 0);
      return total + tareas;
    }, 0);
  }

  getMetroSemana(empId: number): number {
    const idsVistos = new Set<number>();
    return this.diasSemana.reduce((total, dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      const rutas = items
        .filter((i) => {
          if (i.esNueva || i.tipoId !== 2) return false;
          if (i.idAsignacion && idsVistos.has(i.idAsignacion)) return false;
          if (i.idAsignacion) idsVistos.add(i.idAsignacion);
          return true;
        })
        .reduce((sum, i) => sum + (Number(i.dias) || 0), 0);
      return total + rutas;
    }, 0);
  }

  getInteriorExteriorSemana(empId: number): number {
    const idsVistos = new Set<number>();
    return this.diasSemana.reduce((total, dia) => {
      const items = this.dataTemporal[this.generarLlave(empId, dia)] ?? [];
      const dias = items
        .filter((i) => {
          if (i.esNueva || (i.tipoId !== 3 && i.tipoId !== 4)) return false;
          if (i.idAsignacion && idsVistos.has(i.idAsignacion)) return false;
          if (i.idAsignacion) idsVistos.add(i.idAsignacion);
          return true;
        })
        .reduce((sum, i) => sum + (Number(i.dias) || 0), 0);
      return total + dias;
    }, 0);
  }

  /** Recarga solo las asignaciones al navegar de semana (sin volver a pedir empleados) */
  private recargarSemana() {
    this.loading = true;
    this.inicializarDataTemporal();

    this.cargarAsignacionesSemana();
    this.cargarAusenciasSemana();
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
    const ausencia = this.tieneAusencia(empId, dia);
    const key = this.generarLlave(empId, dia);
    const items = this.dataTemporal[key] ?? [];

    if (ausencia) {
      Swal.fire({
        icon: 'info',
        title: `${ausencia.TipoAusencia}`,
        text: `Este empleado tiene ${ausencia.TipoAusencia.toLowerCase()} hasta el ${ausencia.FechaReintegro}`,
      });
      return;
    }

    // Valida que el técnico no esté ocupado en ningún día de la semana
    for (const diaSemana of this.diasSemana) {
      const keySemana = this.generarLlave(empId, diaSemana);
      const itemsSemana = this.dataTemporal[keySemana] ?? [];
      const asigOcupada = itemsSemana.find(
        (i) =>
          !i.esNueva &&
          i.idEstado !== 3 &&
          this.tiposConLimiteIds.includes(i.tipoId),
      );
      if (asigOcupada) {
        this.mostrarAlertaTecnicoOcupado(diaSemana, asigOcupada);
        return;
      }
    }

    // Valida que no estén todos los tipos cubiertos para ese día
    const tiposGuardados = items
      .filter((i) => !i.esNueva && this.tiposConLimiteIds.includes(i.tipoId))
      .map((i) => i.tipoId);
    const todosUsados = this.tiposConLimiteIds.every((t) =>
      tiposGuardados.includes(t),
    );

    if (todosUsados && this.tiposDisponibles(empId, dia).length === 0) {
      //SWEETALERT
      alertaTodosLosTiposAsignados();
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
    const key = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (!item || item.tipoId === 0) return;

    // Evita guardar el mismo tipo dos veces en el mismo día
    if (this.tiposConLimiteIds.includes(item.tipoId)) {
      const duplicado = this.dataTemporal[key].some(
        (i) => i.uid !== item.uid && i.tipoId === item.tipoId && !i.esNueva,
      );
      if (duplicado) {
        alertaTipoDuplicado(this.getNombreTipo(item.tipoId));
        return;
      }
    }

    const fechaStr = this.fechaLocalISO(dia);
    const cantidadFinal = item.tipoId === 2 ? item.dias : item.cantidad;

    const zonaGeo: number | null =
      item.tipoId === 4
        ? item.IdZonaGeo || null
        : item.tipoId === 3
          ? item.centros[0]
            ? (this.centrosCedulacion.find(
                (c) =>
                  c.IdCentroCedulacion === item.centros[0].idCentroCedulacion,
              )?.IdZonaGeo ?? null)
            : null
          : null;

    const payload = {
      idEmpleado: empId,
      fecha: fechaStr,
      idTipo: item.tipoId,
      CantidadAsignaciones:
        item.tipoId === 1 ? Number(item.cantidad) || null : null,
      diasViaje:
        item.tipoId === 2 || item.tipoId === 3
          ? Number(item.dias) || null
          : null,
      IdZonaGeo: zonaGeo,
      idEstado: item.idEstado ?? 1,
      observaciones: null,
      ...([2, 3].includes(item.tipoId) && {
        fechaInicio: item.fechaInicio || null,
        fechaFin: item.fechaFin || null,
        nroTicket: item.nroTicket || null,
        titulo: item.titulo || null,
        chofer: item.chofer || null,
        placa: item.placa || null,
        // array de centros con su orden
        centros: item.centros.map((c, i) => ({
          idCentroCedulacion: c.idCentroCedulacion,
          orden: i + 1, // recalcula el orden según posición en el array
        })),
      }),
    };

    this._empleadosService.guardarAsignacionCelda(payload).subscribe({
      next: (res: any) => {
        item.idAsignacion = res.body?.idAsignacion ?? null;
        item.uid = `saved-${item.idAsignacion}`;
        item.modificado = false;
        item.esNueva = false;
        item.guardadoOk = true;
        this.cargarHistorialDesdeBD();
        this.cargarAsignacionesSemana();
        setTimeout(() => {
          item.guardadoOk = false;
        }, 2000);
        //console.log('Payload guardado:', payload);
      },
      error: (err) => {
        console.error('Error al guardar:', err);

        // 👇 AQUÍ ATRAPAMOS EL MENSAJE EXACTO DEL BACKEND 👇
        if (err.status === 409 && err.error && err.error.message) {
          // Si es el error 409 de Ausencia que configuramos en Node
          Swal.fire({
            icon: 'error',
            title: 'Asignación Bloqueada',
            text: err.error.message, // Mostrará: "Bloqueado: El empleado figura con..."
            confirmButtonColor: '#d33',
          });
        } else if (err.status === 400 && err.error && err.error.message) {
          // Por si también quieres atrapar las validaciones de "Falta fecha", etc.
          Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: err.error.message,
          });
        } else {
          // Si es otro error (ej. se cayó el internet o error 500 del servidor)
          alertaErrorGuardar();
        }
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
    const key = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    //SWEETALERT
    confirmarEliminarAsignacion().then((confirmado) => {
      if (!confirmado) return;

      if (item.idAsignacion) {
        // Está guardada en BD → la elimina del servidor
        this._empleadosService.eliminarAsignacion(item.idAsignacion).subscribe({
          next: () => {
            this.dataTemporal[key].splice(index, 1);
            this.recargarSemana();
            this.cargarHistorialDesdeBD();
          },
          error: () =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la asignación',
            }),
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
    return this.empleadosMaster.filter((e) => this.empleadoEstaOcupado(e.id))
      .length;
  }
  contarDisponibles(): number {
    return this.empleadosMaster.filter((e) => !this.empleadoEstaOcupado(e.id))
      .length;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PUT /api/asignaciones/:id/estado
  // Cambia el estado entre Ocupado (1) y Disponible (3).
  // Si la llamada al servidor falla, revierte el cambio en pantalla.
  // ─────────────────────────────────────────────────────────────────────────
  marcarComoDisponible(empId: number, dia: Date, index: number) {
    const key = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];
    item.idEstado = 3;

    if (!item.idAsignacion) return;

    this._empleadosService
      .actualizarEstadoAsignacion(item.idAsignacion, 3)
      .subscribe({
        error: () => {
          item.idEstado = 1; // Revierte si falla
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo liberar al técnico.',
            timer: 3000,
            showConfirmButton: false,
          });
        },
      });
  }

  marcarComoOcupado(empId: number, dia: Date, index: number) {
    const key = this.generarLlave(empId, dia);
    const item = this.dataTemporal[key][index];

    if (item.tipoId === 1) return; // Sede Central no bloquea al técnico
    item.idEstado = 1;

    if (!item.idAsignacion) return;

    this._empleadosService
      .actualizarEstadoAsignacion(item.idAsignacion, 1)
      .subscribe({
        error: () => {
          item.idEstado = 3; // Revierte si falla
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo marcar como ocupado.',
            timer: 3000,
            showConfirmButton: false,
          });
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

  limpiarBusqueda() {
    this.terminoBusqueda = '';
  }

  /** Devuelve la lista de empleados con búsqueda y filtros aplicados */
  filtrarEmpleados() {
    const b = this.terminoBusqueda.toLowerCase();

    // 1. Filtra por texto de búsqueda
    let lista = this.empleadosMaster.filter(
      (e) =>
        e.nombre.toLowerCase().includes(b) ||
        e.localidad?.toLowerCase().includes(b) ||
        e.ubicacion?.toLowerCase().includes(b) ||
        e.codigo.includes(b),
    );

    // 2. Sin filtros activos → solo orden alfabético
    if (this.filtrosActivos.size === 0) {
      return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // 3. Filtra por posición (auxiliar / soporte) — excluyente entre sí
    const filtrarTipo =
      this.filtrosActivos.has('auxiliar') || this.filtrosActivos.has('soporte');

    if (filtrarTipo) {
      lista = lista.filter((e) => {
        const esAux = e.cargo?.toUpperCase().includes('AUXILIAR');
        const esSop = e.cargo?.toUpperCase().includes('SOPORTE');
        return (
          (this.filtrosActivos.has('auxiliar') && esAux) ||
          (this.filtrosActivos.has('soporte') && esSop)
        );
      });
    }

    // 3b. Filtra por estado ocupado / disponible
    const filtrarOcupado = this.filtrosActivos.has('ocupados');
    const filtrarDisponible = this.filtrosActivos.has('disponibles');

    if (filtrarOcupado || filtrarDisponible) {
      lista = lista.filter((e) => {
        const ocupado = this.empleadoEstaOcupado(e.id);
        return (filtrarOcupado && ocupado) || (filtrarDisponible && !ocupado);
      });
    }

    // 3c. Filtra por nivel del ranking
    const filtrarRankTop = this.filtrosActivos.has('rank-top');
    const filtrarRankMid = this.filtrosActivos.has('rank-mid');
    const filtrarRankLow = this.filtrosActivos.has('rank-low');

    if (filtrarRankTop || filtrarRankMid || filtrarRankLow) {
      lista = lista.filter((e) => {
        const nivel = this.getNivelRanking(e.codigo);
        if (nivel === null) return false; // sin datos del ranking → no se muestra
        return (
          (filtrarRankTop && nivel === 'top') ||
          (filtrarRankMid && nivel === 'mid') ||
          (filtrarRankLow && nivel === 'low')
        );
      });

      // Ordenar por score descendente (mayor aptitud primero)
      return [...lista].sort((a, b) => {
        const sA = this.rankingMap.get(a.codigo) ?? 0;
        const sB = this.rankingMap.get(b.codigo) ?? 0;
        return sB - sA;
      });
    }

    // 4. Ordena por métricas: quien tiene menos asignaciones sube primero
    const score = (e: Empleado): number => {
      let s = 0;
      if (this.filtrosActivos.has('metro')) s += this.getMetroSemana(e.id);
      if (this.filtrosActivos.has('interior'))
        s += this.getInteriorExteriorSemana(e.id);
      if (this.filtrosActivos.has('sede')) s += this.getSedeSemana(e.id);
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
    return `${id}-${this.fechaLocalISO(fecha)}`;
  }

  /** Devuelve las clases CSS de color para una celda según su estado */
  getClaseColor(key: string, fecha: Date): string {
    const items = this.dataTemporal[key] ?? [];
    const tieneOcupado = items.some(
      (i) => i.idEstado !== 3 && this.tiposConLimiteIds.includes(i.tipoId),
    );
    let clases = '';
    if (this.esDiaPasado(fecha)) clases += 'bg-dia-pasado ';
    if (tieneOcupado) clases += 'bg-warning-subtle ';
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
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f < hoy;
  }

  /**
   * Devuelve la fecha en formato 'YYYY-MM-DD' usando hora LOCAL,
   * sin conversiones a UTC. Bulletproof contra timezone shifts.
   */
  private fechaLocalISO(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  PRIVADOS DE SOPORTE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Convierte el formato de la API al formato interno AsignacionCelda */
  private mapearDesdeAPI(a: any): AsignacionCelda {
    // Deserializar el JSON de centros que viene del FOR JSON PATH
    let centros: RutaCentro[] = [];
    if (a.CentrosJSON) {
      try {
        centros = JSON.parse(a.CentrosJSON).map((c: any) => ({
          idRutaCentro: c.IdRutaCentro,
          idCentroCedulacion: c.IdCentroCedulacion,
          orden: c.Orden,
          centro: c.Centro,
          municipio: c.Municipio,
          provincia: c.Provincia,
          zonaGeo: c.ZonaGeo,
        }));
      } catch {
        centros = [];
      }
    }

    return {
      uid: `saved-${a.IdAsignacion}`,
      idAsignacion: a.IdAsignacion,
      tipoId: a.IdTipo ?? 0,
      cantidad:
        a.IdTipo === 1 ? (a.CantidadAsignaciones?.toString() ?? '') : '',
      dias:
        a.IdTipo === 2
          ? (a.DiasViaje?.toString() ??
            a.CantidadAsignaciones?.toString() ??
            '')
          : a.IdTipo === 3
            ? (a.DiasViaje?.toString() ?? '')
            : '',
      IdZonaGeo: a.IdZonaGeo ?? 0,
      idEstado: a.idEstado ?? 1,
      modificado: false,
      guardadoOk: false,
      esNueva: false,
      idDetalle: a.IdDetalle ?? null,
      fechaInicio: a.FechaInicio ?? '',
      fechaFin: a.FechaFinalizacion ?? '',
      nroTicket: a.NroTicket ?? '',
      titulo: a.Titulo ?? '',
      chofer: a.Chofer ?? '',
      placa: a.Placa ?? '',
      centros,
    };
  }

  /** Crea un objeto AsignacionCelda vacío para filas nuevas (aún no guardadas) */
  private nuevaCeldaVacia(): AsignacionCelda {
    this.uidCounter++;
    return {
      uid: `new-${this.uidCounter}`,
      idAsignacion: null,
      tipoId: 0,
      cantidad: '',
      dias: '',
      IdZonaGeo: 0,
      idEstado: 1,
      modificado: false,
      guardadoOk: false,
      esNueva: true,
      idDetalle: null,
      fechaInicio: '',
      fechaFin: '',
      nroTicket: '',
      titulo: '',
      chofer: '',
      placa: '',
      centros: [], // ← array vacío
    };
  }

  /** Muestra el alert cuando el técnico ya tiene una asignación activa esta semana */
  private mostrarAlertaTecnicoOcupado(
    diaSemana: Date,
    asigOcupada: AsignacionCelda,
  ) {
    const nombreDia = diaSemana.toLocaleDateString('es-DO', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });
    const nombreTipo = this.getNombreTipo(asigOcupada.tipoId);

    let detalle = '';
    if (asigOcupada.tipoId === 1 && asigOcupada.cantidad)
      detalle = ` · ${asigOcupada.cantidad} tareas`;
    else if (asigOcupada.tipoId === 2 && asigOcupada.dias)
      detalle = ` · 🚇 ${asigOcupada.dias} rutas`;
    else if (
      (asigOcupada.tipoId === 3 || asigOcupada.tipoId === 4) &&
      asigOcupada.IdZonaGeo
    )
      detalle = ` · ${asigOcupada.dias}d — ${asigOcupada.IdZonaGeo}`;

    alertaTecnicoOcupado(diaSemana, asigOcupada);
  }

  /** Agrega un centro vacío a la lista del item */
  agregarCentro(item: AsignacionCelda) {
    item.centros.push({
      idCentroCedulacion: 0,
      orden: item.centros.length + 1,
    });
    item.modificado = true;
  }

  /** Quita un centro de la lista por índice */
  quitarCentro(item: AsignacionCelda, index: number) {
    item.centros.splice(index, 1);
    // Reordenar
    item.centros.forEach((c, i) => (c.orden = i + 1));
    item.modificado = true;
  }

  /** Cuando seleccionan un centro, rellena los datos derivados (municipio, provincia, etc.) */
  onCentroSeleccionado(item: AsignacionCelda, index: number) {
    const centroData = this.centrosCedulacion.find(
      (c) => c.IdCentroCedulacion === item.centros[index].idCentroCedulacion,
    );
    if (centroData) {
      item.centros[index].centro = centroData.Centro;
      item.centros[index].municipio = centroData.Municipio;
      item.centros[index].provincia = centroData.Provincia;
      item.centros[index].zonaGeo = centroData.ZonaGeo;
    }
    item.modificado = true;
  }

  /**
   * Convierte un string de base de datos ('YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss')
   * a un objeto Date estricto en la zona horaria local a las 00:00:00,
   * evitando que JavaScript reste horas por el UTC.
   */
  private parsearFechaLocal(fechaStr: string): Date {
    if (!fechaStr) return new Date(); // Por seguridad
    const partes = fechaStr.split('T')[0].split('-');
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // En JS los meses van de 0 a 11
    const dia = parseInt(partes[2], 10);
    return new Date(anio, mes, dia);
  }
}
