import { Component, OnInit } from '@angular/core';
import { BdayPersonaService } from '../../services/bday-persona.service';
import { CumpleaneroAPI } from '../../interfaces/bdayPersona';

// 1. Nueva interfaz: Ya no usamos "Grupos", sino una Persona con su etiqueta de día ya calculada
export interface BdayPersonaUI {
  nombre: string;
  codigo: string;
  edad: number;
  diasFaltantes: number;
  esHoy: boolean;
  etiquetaDia: string; // Ejemplo: '¡Hoy!', 'Ayer', 'Dom 3'
}

@Component({
  selector: 'app-bday-widget',
  standalone: true,
  imports: [], 
  templateUrl: './bday-widget.component.html',
  styleUrl: './bday-widget.component.scss'
})
export class BdayWidgetComponent implements OnInit {

  // 2. La variable ahora es una lista plana de personas, tal como espera tu HTML
  personas: BdayPersonaUI[] = [];
  cargando: boolean = true;
 
  get totalHoy(): number {
    return this.personas.filter(p => p.esHoy).length;
  }
 
  get totalSemana(): number {
    return this.personas.length;
  }
 
  constructor(private bdaySvc: BdayPersonaService) {}
 
  ngOnInit(): void {
    this.getCumpleanosSemana();
  }

  getCumpleanosSemana() {
    this.bdaySvc.getCumpleanosSemana().subscribe({
      next: (response: any) => {
        // 3. Pasamos el body a la nueva función que los procesa y ordena
        this.personas = this.procesarYOrdenar(response.body);
        this.cargando = false;
        console.log('Respuesta procesada:', this.personas); 
      },
      error: () => { 
        this.cargando = false;
      },
    });
  }
 
  inicial(nombre: string): string {
    return nombre?.trim()?.[0]?.toUpperCase() ?? '?';
  }

  // ── LÓGICA DE TRANSFORMACIÓN Y ORDEN (Reemplaza a agruparCumpleanos) ──

  private procesarYOrdenar(data: CumpleaneroAPI[]): BdayPersonaUI[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const lista = data.map(p => {
      // 🚨 FIX DE ZONA HORARIA 🚨
      // Cortamos el string en la 'T' para quedarnos solo con "2026-05-07"
      // y separamos por guiones para armar la fecha local exacta sin restar horas.
      const partes = p.FechaCelebracion.split('T')[0].split('-');
      const year = parseInt(partes[0], 10);
      const month = parseInt(partes[1], 10) - 1; // En JavaScript enero es 0
      const day = parseInt(partes[2], 10);
      
      const fechaCeleb = new Date(year, month, day);
      fechaCeleb.setHours(0, 0, 0, 0);
      
      const diffTime = fechaCeleb.getTime() - hoy.getTime();
      const diasFaltantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

      return {
        nombre: p.nombre,
        codigo: p.codigo,
        edad: p.EdadActual,
        diasFaltantes: diasFaltantes,
        esHoy: diasFaltantes === 0,
        etiquetaDia: this.generarEtiquetaCorta(diasFaltantes, fechaCeleb)
      };
    });

    // Ordenamiento personalizado: Hoy -> Ayer -> Pasados -> Mañana -> Futuros
    return lista.sort((a, b) => {
      const getPeso = (d: number) => {
        if (d === 0) return 10;  // 1. Hoy
        if (d === -1) return 20; // 2. Ayer
        if (d < 0) return 30 + Math.abs(d); // 3. Pasados
        if (d === 1) return 40;  // 4. Mañana
        return 50 + d;           // 5. Futuros
      };
      return getPeso(a.diasFaltantes) - getPeso(b.diasFaltantes);
    });
  }

  private generarEtiquetaCorta(dias: number, fecha: Date): string {
    if (dias === 0) return '¡Hoy!';
    if (dias === -1) return 'Ayer';
    if (dias === 1) return 'Mañana';
    
    // Si no es ninguno de los anteriores, mostramos algo corto como "Dom 3"
    const diaSemana = fecha.toLocaleDateString('es-DO', { weekday: 'short' });
    const diaStr = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    return `${diaStr} ${fecha.getDate()}`;
  }
}