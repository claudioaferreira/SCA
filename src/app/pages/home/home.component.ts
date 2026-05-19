import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadosService } from '../../services/empleados.service';
import { BdayWidgetComponent } from "../../components/bday-widget/bday-widget.component";
import { AusenciasWidgetComponent } from '../../components/ausencias-widget/ausencias-widget.component';
import { RankingWidgetComponent } from '../../components/ranking-widget/ranking-widget.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { SocketService } from '../../services/socket.service';

type FiltroPeriodo = 'hoy' | 'semana' | 'mes' | 'personalizado';
type PickerTab      = 'mes' | 'rango';

const TIPO = { SEDE: 1, METRO: 2, INTERIOR: 3, EXTERIOR: 4 } as const;
type TipoId = typeof TIPO[keyof typeof TIPO];

export interface EmpleadoKpi {
  IdEmpleado:     number;
  Empleado:       string;
  Codigo:         string;
  TotalCantidad:  number;
  TotalDias:      number;
  TotalRegistros: number;
  IdTipo?:        number;
}

export interface EmpleadoZona {
  IdEmpleado:    number;
  Empleado:      string;
  Codigo:        string;
  IdZonaGeo:     number;
  ZonaGeo:       string;
  TotalRutas:    number;
  TotalDias:     number;
  TotalCantidad: number;
}

const MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_DOW    = ['L','M','X','J','V','S','D'];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, BdayWidgetComponent, AusenciasWidgetComponent, RankingWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
    animations: [
      trigger('fadeIn', [
        transition(':enter', [
          style({ opacity: 0, transform: 'translateY(-6px)' }),
          animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ]),
    ],
  })
  
export class HomeComponent implements OnInit, OnDestroy {

  private socketSvc = inject(SocketService);

  // ── Filtros periodo ───────────────────────────────────────────────────────
  filtroPeriodo: FiltroPeriodo = 'hoy';

  // ── Picker personalizado ──────────────────────────────────────────────────
  pickerOpen      = false;
  pickerTab: PickerTab = 'mes';

  // Mes
  pickerYear      = new Date().getFullYear();
  pickerMonth: number | null = null;

  // Rango
  rangeStart: string | null = null;
  rangeEnd:   string | null = null;
  rangeSelecting = false;  // true = primer clic hecho, esperando segundo

  // Calendario de rango
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  calDays: { day: number | null; date: string; isToday: boolean; isStart: boolean; isEnd: boolean; inRange: boolean; }[] = [];

  // Rango aplicado (para la query)
  customInicio: string | null = null;
  customFin:    string | null = null;

  // ── Estado general ────────────────────────────────────────────────────────
  cargando = true;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  sedeTareas         = 0;
  sedeEmpleados      = 0;
  metroDias          = 0;
  metroEmpleados     = 0;
  interiorDias       = 0;
  interiorEmpleados  = 0;
  exteriorDias       = 0;
  exteriorEmpleados  = 0;
  metroAsignaciones    = 0;
  interiorAsignaciones = 0;
  exteriorAsignaciones = 0;
  disponiblesHoy       = 0; 
  ocupadosHoy          = 0; 
  desplieguesActivos   = 0; 

  // ── Zonas ─────────────────────────────────────────────────────────────────
zonasResumen: { nombre: string; dias: number; asignaciones: number; empleados: number; color: string }[] = [];

   // ── Zonas Exterior (NUEVO) ────────────────────────────────────────────────
  zonasExterior: { nombre: string; rutas: number; dias: number; empleados: number; color: string }[] = [];

  // ── Empleados por tipo ────────────────────────────────────────────────────
  empleadosPorTipo: Record<TipoId, EmpleadoKpi[]> = {
    [TIPO.SEDE]:     [],
    [TIPO.METRO]:    [],
    [TIPO.INTERIOR]: [],
    [TIPO.EXTERIOR]: [],
  };

    // ── Zonas por empleado para el popover (NUEVO) ────────────────────────────
  // clave: IdEmpleado → array de zonas
  zonasPorEmpleado: Map<number, EmpleadoZona[]> = new Map();
  cargandoZonas = false;

  // ── Popover ───────────────────────────────────────────────────────────────
  popoverTipo:    TipoId | null = null;
  popoverVisible  = false;
  popoverTop      = 0;
  popoverLeft     = 0;


  private closeTimer: any = null;
  private readonly CLOSE_DELAY = 120;
  readonly TIPO_REF = TIPO;
  readonly MESES_FULL_REF  = MESES_FULL;
  readonly MESES_SHORT_REF = MESES_SHORT;
  readonly DIAS_DOW_REF    = DIAS_DOW;

  private zonaColores: Record<number, string> = {
    1: '#6366f1', 2: '#0ea5e9', 3: '#16a34a', 4: '#d97706', 5: '#ef4444',
  };

  private _svc = inject(EmpleadosService);

 ngOnInit(): void {
  // ── Recibir KPIs del socket ───────────────────────────────────
  this.socketSvc.escucharEvento('kpi:datos').subscribe((kpi: any) => {
  if (!kpi) return;

  // SEDE
  this.sedeTareas        = kpi.TareasSede           ?? 0;
  this.sedeEmpleados     = kpi.EmpleadosSede         ?? 0;

  // METRO
  this.metroAsignaciones = kpi.AsignacionesMetro     ?? 0;
  this.metroDias         = kpi.DiasMetro             ?? 0;
  this.metroEmpleados    = kpi.EmpleadosMetro        ?? 0;

  // INTERIOR
  this.interiorAsignaciones = kpi.AsignacionesInterior ?? 0;
  this.interiorDias         = kpi.DiasInterior          ?? 0;
  this.interiorEmpleados    = kpi.EmpleadosInterior     ?? 0;

  // EXTERIOR
  this.exteriorAsignaciones = kpi.AsignacionesExterior ?? 0;
  this.exteriorDias         = kpi.DiasExterior          ?? 0;
  this.exteriorEmpleados    = kpi.EmpleadosExterior     ?? 0;

  // GENERAL
  this.disponiblesHoy     = kpi.DisponiblesHoy       ?? 0;
  this.ocupadosHoy        = kpi.OcupadosHoy          ?? 0;
  this.desplieguesActivos = kpi.DesplieguesActivos   ?? 0;

  this.cargando = false;
});

  // ── Cuando alguien guarda → refrescar todo ────────────────────
 this.socketSvc.escucharEvento('kpi:actualizado').subscribe(() => {
  this.cargarTodo(false);
});

  // ── Carga inicial ─────────────────────────────────────────────
  this.cargarTodo();
}
  ngOnDestroy() { this.cancelarClose(); }

  // ── Cierre del picker al hacer clic fuera ─────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.picker-wrapper')) {
      this.pickerOpen = false;
    }
  }

  // ── Tabs rápidos ──────────────────────────────────────────────────────────
  setFiltro(periodo: Exclude<FiltroPeriodo, 'personalizado'>) {
    this.filtroPeriodo  = periodo;
    this.pickerOpen     = false;
    this.cargarTodo();
  }

  // ── Picker ───────────────────────────────────────────────────────────────
  togglePicker(e: MouseEvent) {
    e.stopPropagation();
    this.pickerOpen = !this.pickerOpen;
  }

  switchPickerTab(tab: PickerTab) {
    this.pickerTab = tab;
    if (tab === 'rango') this.buildCal();
  }

  closePicker() { this.pickerOpen = false; }

  // ── Picker — mes ─────────────────────────────────────────────────────────
  changePickerYear(d: number) { this.pickerYear += d; }

  selectPickerMonth(m: number) {
    this.pickerMonth = m;
  }

  isPickerMonthSelected(m: number): boolean {
    return this.pickerTab === 'mes' && this.pickerMonth === m;
  }

  isCurrentMonth(m: number): boolean {
    const now = new Date();
    return m === now.getMonth() && this.pickerYear === now.getFullYear();
  }

  // ── Picker — rango quick ──────────────────────────────────────────────────
  applyQuickRange(days: number) {
    const end   = new Date();
    const start = new Date(); start.setDate(end.getDate() - days + 1);
    this.rangeStart = this.fmt(start);
    this.rangeEnd   = this.fmt(end);
    this.buildCal();
  }

  // ── Picker — calendario rango ─────────────────────────────────────────────
  changeCalMonth(d: number) {
    this.calMonth += d;
    if (this.calMonth < 0)  { this.calMonth = 11; this.calYear--; }
    if (this.calMonth > 11) { this.calMonth = 0;  this.calYear++; }
    this.buildCal();
  }

  get calTitle(): string {
    return `${MESES_FULL[this.calMonth]} ${this.calYear}`;
  }

  buildCal() {
    const first  = new Date(this.calYear, this.calMonth, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const days   = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    const todayStr = this.fmt(new Date());

    this.calDays = [];

    for (let i = 0; i < offset; i++) {
      this.calDays.push({ day: null, date: '', isToday: false, isStart: false, isEnd: false, inRange: false });
    }
    for (let d = 1; d <= days; d++) {
      const dt   = new Date(this.calYear, this.calMonth, d);
      const date = this.fmt(dt);
      this.calDays.push({
        day:     d,
        date,
        isToday:  date === todayStr,
        isStart:  date === this.rangeStart,
        isEnd:    date === this.rangeEnd,
        inRange:  !!(this.rangeStart && this.rangeEnd && date > this.rangeStart && date < this.rangeEnd),
      });
    }
  }

  pickCalDay(date: string) {
    if (!date) return;
    if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
      this.rangeStart     = date;
      this.rangeEnd       = null;
      this.rangeSelecting = true;
    } else {
      if (date < this.rangeStart) {
        this.rangeEnd   = this.rangeStart;
        this.rangeStart = date;
      } else {
        this.rangeEnd = date;
      }
      this.rangeSelecting = false;
    }
    this.buildCal();
  }

  // ── Aplicar selección ─────────────────────────────────────────────────────
  applySelection() {
    if (this.pickerTab === 'mes' && this.pickerMonth !== null) {
      const ini = new Date(this.pickerYear, this.pickerMonth, 1);
      const fin = new Date(this.pickerYear, this.pickerMonth + 1, 0);
      this.customInicio = this.fmt(ini);
      this.customFin    = this.fmt(fin);
      this.filtroPeriodo = 'personalizado';
      this.pickerOpen    = false;
      this.cargarTodo();
    } else if (this.pickerTab === 'rango' && this.rangeStart) {
      this.customInicio = this.rangeStart;
      this.customFin    = this.rangeEnd ?? this.rangeStart;
      this.filtroPeriodo = 'personalizado';
      this.pickerOpen    = false;
      this.cargarTodo();
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
 private cargarTodo(mostrarCarga = true) {
  if (mostrarCarga) this.cargando = true;
    const { inicio, fin } = this.getRango();


    // KPIs principales
     this.socketSvc.emitir('kpi:solicitar', { inicio, fin });
    // this._svc.getResumenHome(inicio, fin).subscribe({
    //   next: (res) => {
    //     //console.log('resumenHome:', res.body); 
    //     const data: any[] = res.body ?? [];
    //     const g = (tipo: TipoId) => data.find((d: any) => d.IdTipo === tipo);
 
    //     const sede = g(TIPO.SEDE);
    //     this.sedeTareas    = sede?.TotalCantidad          ?? 0;
    //     this.sedeEmpleados = sede?.EmpleadosInvolucrados  ?? 0;
 
    //     const metro = g(TIPO.METRO);
    //     this.metroDias      = metro?.TotalDias             ?? 0;
    //     this.metroEmpleados = metro?.EmpleadosInvolucrados ?? 0;
    //     this.metroAsignaciones   = metro?.TotalRegistros        ?? 0;
 
    //     const interior = g(TIPO.INTERIOR);
    //     this.interiorDias      = interior?.TotalDias             ?? 0;
    //     this.interiorEmpleados = interior?.EmpleadosInvolucrados ?? 0;
    //     this.interiorAsignaciones   = interior?.TotalRegistros        ?? 0; 
 
    //     const exterior = g(TIPO.EXTERIOR);
    //     this.exteriorDias      = exterior?.TotalDias             ?? 0;
    //     this.exteriorEmpleados = exterior?.EmpleadosInvolucrados ?? 0;
    //     this.exteriorAsignaciones   = exterior?.TotalRegistros        ?? 0;
 
    //     this.cargando = false;
    //   },
    //   error: () => (this.cargando = false)
    // });
 
    // Zonas Interior
    this._svc.getResumenZonas(inicio, fin).subscribe({
      next: (res) => {
        this.zonasResumen = (res.body ?? []).map((z: any) => ({
          nombre:    z.Zona,
          dias:      z.TotalDias,
          asignaciones: z.TotalAsignaciones ?? 0,
          empleados: z.EmpleadosInvolucrados ?? 0,
          color:     this.zonaColores[z.IdZonaGeo] ?? '#94a3b8',
        }));
      }
    });
 
    // Zonas Exterior (NUEVO)
    this._svc.getResumenZonasExterior(inicio, fin).subscribe({
      next: (res) => {
        this.zonasExterior = (res.body ?? []).map((z: any) => ({
          nombre:    z.Zona,
          rutas:     z.TotalRutas,
          dias:      z.TotalDias,
          empleados: z.EmpleadosInvolucrados ?? 0,
          color:     this.zonaColores[z.IdZonaGeo] ?? '#94a3b8',
        }));
      }
    });

    
 
   // Empleados por tipo (para el popover básico)
this.resetEmpleados();
this._svc.getEmpleadosPorTipo(inicio, fin).subscribe({
  next: (res) => {
    const lista: (EmpleadoKpi & { IdTipo: TipoId })[] = res.body ?? [];
    
    lista.forEach(e => {
      if (this.empleadosPorTipo[e.IdTipo] !== undefined) {
        this.empleadosPorTipo[e.IdTipo].push(e);
      }
    });

    Object.keys(this.empleadosPorTipo).forEach(tipoKey => {
      const tipoId = Number(tipoKey) as TipoId;
      const empleados = this.empleadosPorTipo[tipoId];

      empleados.sort((a, b) => {
        // CASO 1: SEDE CENTRAL -> Ordenar por tareas (TotalCantidad)
        if (tipoId === TIPO.SEDE) {
          return b.TotalCantidad - a.TotalCantidad;
        } 
        
        // CASO 2: INTERIOR (O EXTERIOR) -> Ordenar PRIMERO por Días
        if (tipoId === TIPO.INTERIOR || tipoId === TIPO.EXTERIOR) {
          if (b.TotalDias !== a.TotalDias) {
            return b.TotalDias - a.TotalDias; // Más días arriba
          }
          return b.TotalRegistros - a.TotalRegistros; // Desempate por asignaciones
        }

        // CASO 3: METRO (O POR DEFECTO) -> Ordenar por Asignaciones
        if (b.TotalRegistros !== a.TotalRegistros) {
          return b.TotalRegistros - a.TotalRegistros;
        }
        return b.TotalDias - a.TotalDias;
      });
    });
  }
});
  }

  private resetEmpleados() {
    ([TIPO.SEDE, TIPO.METRO, TIPO.INTERIOR, TIPO.EXTERIOR] as TipoId[])
      .forEach(t => this.empleadosPorTipo[t] = []);
  }

  // ── Popover empleados ─────────────────────────────────────────────────────
  onChipMouseEnter(event: MouseEvent, tipo: TipoId) {
    if (this.getConteoEmpleados(tipo) === 0) return;
    this.cancelarClose();
    this.popoverTipo    = tipo;
    this.popoverVisible = true;
    this.posicionarPopover(event);
     this.cargarZonasParaTipo(tipo);
  }

  onChipMouseLeave() { this.programarClose(); }
  onPopoverMouseEnter() { this.cancelarClose(); }
  onPopoverMouseLeave() { this.programarClose(); }

  private programarClose() {
    this.cancelarClose();
    this.closeTimer = setTimeout(() => {
      this.popoverVisible = false;
      this.popoverTipo    = null;
    }, this.CLOSE_DELAY);
  }

  private cancelarClose() {
    if (this.closeTimer !== null) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  private posicionarPopover(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.popoverTop  = rect.bottom + window.scrollY + 6;
    this.popoverLeft = rect.left   + window.scrollX;
  }

   private cargarZonasParaTipo(tipo: TipoId) {
    // Solo tipos que tienen sentido de zonificación (Metro, Interior, Exterior)
    // Para Sede no aplica zona geo
    if (tipo === TIPO.SEDE) return;
 
    this.cargandoZonas = true;
    const { inicio, fin } = this.getRango();
 
    this._svc.getEmpleadosPorZona(inicio, fin, tipo).subscribe({
      next: (res) => {
        const lista: EmpleadoZona[] = res.body ?? [];
        this.zonasPorEmpleado = new Map();
        lista.forEach(item => {
          const actual = this.zonasPorEmpleado.get(item.IdEmpleado) ?? [];
          actual.push(item);
          this.zonasPorEmpleado.set(item.IdEmpleado, actual);
        });
        this.cargandoZonas = false;
      },
      error: () => (this.cargandoZonas = false)
    });
  }
 
  // NUEVO — helper para el template: devuelve las zonas de un empleado concreto
  getZonasEmpleado(idEmpleado: number): EmpleadoZona[] {
    return this.zonasPorEmpleado.get(idEmpleado) ?? [];
  }
 
  // NUEVO — color de una zona geo
  getColorZona(idZonaGeo: number): string {
    return this.zonaColores[idZonaGeo] ?? '#94a3b8';
  }

  // ── Helpers template ──────────────────────────────────────────────────────
  get empleadosActivos(): EmpleadoKpi[] {
    return this.popoverTipo ? (this.empleadosPorTipo[this.popoverTipo] ?? []) : [];
  }

  getConteoEmpleados(tipo: TipoId): number {
    return ({
      [TIPO.SEDE]:     this.sedeEmpleados,
      [TIPO.METRO]:    this.metroEmpleados,
      [TIPO.INTERIOR]: this.interiorEmpleados,
      [TIPO.EXTERIOR]: this.exteriorEmpleados,
    } as Record<TipoId, number>)[tipo] ?? 0;
  }

  getValorMetrica(emp: EmpleadoKpi, tipo: TipoId): number {
    return tipo === TIPO.SEDE ? emp.TotalCantidad : emp.TotalDias;
  }

  getLabelMetrica(tipo: TipoId): string {
    return tipo === TIPO.SEDE ? 'tareas' : 'días';
  }

  getLabelTipo(tipo: TipoId): string {
    return ({
      [TIPO.SEDE]:     'Sede Central',
      [TIPO.METRO]:    'Rutas Metro',
      [TIPO.INTERIOR]: 'Interior',
      [TIPO.EXTERIOR]: 'Exterior',
    } as Record<TipoId, string>)[tipo];
  }

  // ── Fechas ────────────────────────────────────────────────────────────────
  get labelFecha(): string {
    const { inicio, fin } = this.getRango();
    if (inicio === fin) return this.fmtDisplay(new Date(inicio + 'T00:00'));
    return `${this.fmtDisplay(new Date(inicio + 'T00:00'))}  →  ${this.fmtDisplay(new Date(fin + 'T00:00'))}`;
  }

  get labelPeriodo(): string {
    if (this.filtroPeriodo === 'personalizado') {
      if (this.pickerTab === 'mes' && this.pickerMonth !== null)
        return `${MESES_SHORT[this.pickerMonth]} ${this.pickerYear}`;
      return 'Personalizado';
    }
    return ({ hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes' } as Record<string, string>)[this.filtroPeriodo] ?? '';
  }

  getRango(): { inicio: string; fin: string } {
    if (this.filtroPeriodo === 'personalizado' && this.customInicio && this.customFin) {
      return { inicio: this.customInicio, fin: this.customFin };
    }
    const hoy = new Date();
    if (this.filtroPeriodo === 'hoy')    { const s = this.fmt(hoy); return { inicio: s, fin: s }; }
    if (this.filtroPeriodo === 'semana') {
      const dia   = hoy.getDay();
      const diff  = dia === 0 ? -6 : 1 - dia;
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() + diff);
      const dom   = new Date(lunes); dom.setDate(lunes.getDate() + 6);
      return { inicio: this.fmt(lunes), fin: this.fmt(dom) };
    }
    return {
      inicio: this.fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      fin:    this.fmt(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)),
    };
  }

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }

  private fmtDisplay(d: Date): string {
    return `${d.getDate()} ${MESES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }





}