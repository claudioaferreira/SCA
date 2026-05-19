import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpleadosService } from '../../services/empleados.service';

export interface RankingDisponibilidad {
  Empleado: string;
  Codigo: string;
  ScoreDisponibilidad: number;
  TotalRutas: number;
  DiasAcumulados: number;
  UltimaSalida: string | null;
}

export type NivelTab = 'top' | 'mid' | 'low';

@Component({
  selector: 'app-ranking-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking-widget.component.html',
  styleUrl: './ranking-widget.component.scss'
})
export class RankingWidgetComponent implements OnChanges {

  /** Rango de fechas recibido desde el Home (formato YYYY-MM-DD) */
  @Input() inicio!: string;
  @Input() fin!: string;

  ranking: RankingDisponibilidad[] = [];
  cargando = true;


    private _svc = inject(EmpleadosService);

  /** Tab activa */
  tabActiva: NivelTab = 'top';

  // ── Umbrales dinámicos por terciles de DiasAcumulados ──────
  private umbralAlto = 0;
  private umbralMid  = 0;

  private calcularUmbrales(): void {
    if (!this.ranking.length) return;
    const dias = [...this.ranking]
      .map(r => r.DiasAcumulados)
      .sort((a, b) => b - a);
    const t1 = Math.floor(dias.length / 3);
    const t2 = Math.floor((dias.length * 2) / 3);
    this.umbralAlto = dias[t1]  ?? 0;
    this.umbralMid  = dias[t2]  ?? 0;
  }

  // ── Grupos (más viajes = Alto = evitar) ───────────────────────
  get grupoTop(): RankingDisponibilidad[] {
    return this.ranking.filter(r => r.DiasAcumulados >= this.umbralAlto);
  }
  get grupoMid(): RankingDisponibilidad[] {
    return this.ranking.filter(r =>
      r.DiasAcumulados >= this.umbralMid &&
      r.DiasAcumulados < this.umbralAlto
    );
  }
  get grupoLow(): RankingDisponibilidad[] {
    return this.ranking.filter(r => r.DiasAcumulados < this.umbralMid);
  }

  /** Lista visible según tab activa, ordenada de más a menos días */
  get listaActiva(): RankingDisponibilidad[] {
    const map: Record<NivelTab, RankingDisponibilidad[]> = {
      top: this.grupoTop,
      mid: this.grupoMid,
      low: this.grupoLow,
    };
    return [...map[this.tabActiva]].sort((a, b) => b.DiasAcumulados - a.DiasAcumulados);
  }

  /** Días máximos del grupo visible (para normalizar barras) */
  get maxDias(): number {
    return Math.max(...this.listaActiva.map(r => r.DiasAcumulados), 1);
  }

  /** Offset de posición global */
  get offsetRanking(): number {
    if (this.tabActiva === 'mid') return this.grupoTop.length;
    if (this.tabActiva === 'low') return this.grupoTop.length + this.grupoMid.length;
    return 0;
  }



  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['inicio'] || changes['fin']) && this.inicio && this.fin) {
      this.cargarRanking();
    }
  }

  private cargarRanking(): void {
    this.cargando = true;
    const anioRef    = new Date(this.fin).getFullYear();
    const inicioAnio = `${anioRef}-01-01`;
    const finAnio    = `${anioRef}-12-31`;

    this._svc.getRankingDisponibilidad(inicioAnio, finAnio).subscribe({
      next: (res) => {
        this.ranking = res.body ?? [];
        this.calcularUmbrales();
        // Abrir automáticamente la tab que tenga datos
        if (this.grupoTop.length > 0)       this.tabActiva = 'top';
        else if (this.grupoMid.length > 0)  this.tabActiva = 'mid';
        else                                 this.tabActiva = 'low';
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  setTab(tab: NivelTab): void {
    this.tabActiva = tab;
  }

  // ── Helpers de vista ───────────────────────────────────────────

  /** Barra normalizada sobre el máximo de días del grupo */
  getBarWidth(dias: number): number {
    return Math.round((dias / this.maxDias) * 100);
  }

  /** Clase de color: top = rojo (saturado), mid = amarillo, low = verde (disponible) */
  getScoreClass(item: RankingDisponibilidad): NivelTab {
    if (item.DiasAcumulados >= this.umbralAlto) return 'top';
    if (item.DiasAcumulados >= this.umbralMid)  return 'mid';
    return 'low';
  }

  getMedal(index: number): string {
    return (['🥇', '🥈', '🥉'] as string[])[index] ?? '';
  }

  /** Si la foto no existe, oculta el img y muestra el inicial */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const inicial = img.nextElementSibling as HTMLElement;
    if (inicial) inicial.style.display = '';
  }

  inicial(nombre: string): string {
    return nombre?.trim()?.[0]?.toUpperCase() ?? '?';
  }
}