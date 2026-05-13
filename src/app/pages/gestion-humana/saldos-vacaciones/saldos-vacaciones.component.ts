import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


import { GestionHumanaService } from '../../../services/gestion-humana.service';

interface SaldoVacaciones {
  id: number;
  nombre: string;
  codigo: string;
  FechaIngreso: string;
  AnioActual  : number;  
  Anos: number;
  anoActual: number;
  DiasAsignados: number;
  DiasArrastre: number;
  DiasAjuste: number;
  DiasTotales: number;
  DiasUsados: number;
  DiasDisponibles: number;
  Comentarios: string | null;
}

@Component({
  selector: 'app-saldos-vacaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './saldos-vacaciones.component.html',
  styleUrl: './saldos-vacaciones.component.scss'
})
export class SaldosVacacionesComponent {

 loading = false;
  saldos: SaldoVacaciones[] = [];

  filtroTexto  = '';
  filtroEstado = 'todos';   // 'todos' | 'bajo' | 'cero'

  anoActual = new Date().getFullYear();
  anioYaCerrado = false;

  aniosFiltro: number[] = [];
  anioFiltrado = new Date().getFullYear();

  // Histórico que se muestra en el modal
  historicoEmpleado: any[] = [];

  aniosDisponiblesModal: number[] = [];


  // Modal
  modalAbierto = false;
  saldoEditando: SaldoVacaciones | null = null;
  formEdicion!: FormGroup;

  private fb        = inject(FormBuilder);
  private ghService = inject(GestionHumanaService);

  ngOnInit(): void {
    this.construirForm();
    this.cargarSaldos();
    this.chequearAnioCerrado(); 
    this.cargarAniosFiltro();
    const actual = new Date().getFullYear();
    this.aniosDisponiblesModal = [actual, actual-1, actual-2, actual-3];
  }

  private cargarAniosFiltro(): void {
  // Genera lista: [añoActual, año-1, año-2, año-3] para el selector
  const a = new Date().getFullYear();
  this.aniosFiltro = [a, a - 1, a - 2, a - 3];
  console.log('Años para filtro desde cargarAniosFiltro:', this.aniosFiltro);
}

  private chequearAnioCerrado(): void {
  // Si para el año actual ya hay filas, significa que el rollover del año anterior se hizo
  this.ghService.verificarAnioCerrado(this.anoActual).subscribe({
    next: (res) => this.anioYaCerrado = res.body?.cerrado === true,
   
  });
  console.log('Año cerrado desde chequearAnioCerrado:', this.anioYaCerrado);
}

  // ── CARGA ───────────────────────────────────────────────────────
  cargarSaldos(): void {
    this.loading = true;
    this.ghService.getSaldos().subscribe({
      next: (res) => {
        this.saldos = res.body ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // ── FILTRO ──────────────────────────────────────────────────────
  saldosFiltrados(): SaldoVacaciones[] {
    const texto = this.filtroTexto.toLowerCase().trim();

    return this.saldos.filter(s => {
      const coincideTexto =
        !texto ||
        s.nombre.toLowerCase().includes(texto) ||
        s.codigo.includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'bajo' && s.DiasDisponibles > 0 && s.DiasDisponibles <= 3) ||
        (this.filtroEstado === 'cero' && s.DiasDisponibles <= 0);

      return coincideTexto && coincideEstado;
    });
  }

  // ── MODAL ───────────────────────────────────────────────────────
  private construirForm(): void {
    this.formEdicion = this.fb.group({
      anio:          [new Date().getFullYear()], 
      diasAsignados: [null],
      diasArrastre:  [0],
      diasAjuste:    [0],
      comentarios:   [''],
    });
  }

  abrirModal(s: SaldoVacaciones): void {
    this.saldoEditando = s;
    this.formEdicion.patchValue({
      anio:          s.anoActual,
      diasAsignados: s.DiasAsignados !== this.diasAutomaticos(s.Anos) ? s.DiasAsignados : null,
      diasArrastre:  s.DiasArrastre,
      diasAjuste:    s.DiasAjuste,
      comentarios:   s.Comentarios ?? '',
    });
    this.cargarHistoricoEmpleado(s.id);
    this.modalAbierto = true;
  }

  private cargarHistoricoEmpleado(idEmpleado: number): void {
  this.ghService.getSaldoHistoricoEmpleado(idEmpleado).subscribe({
    next: (res) => this.historicoEmpleado = res.body ?? [],
  });
  console.log('Histórico cargado desde cargarHistoricoEmpleado:', this.historicoEmpleado);
}

  cerrarModal(): void {
    this.modalAbierto = false;
    this.saldoEditando = null;
  }

  // Cálculos en vivo dentro del modal
  diasAutomaticos(anos: number): number {
    if (anos < 5)  return 15;
    if (anos < 10) return 20;
    return 25;
  }

  totalCalculado(): number {
    if (!this.saldoEditando) return 0;
    const v = this.formEdicion.value;
    const asignados = v.diasAsignados ?? this.diasAutomaticos(this.saldoEditando.Anos);
    return Number(asignados) + Number(v.diasArrastre || 0) + Number(v.diasAjuste || 0);
  }

  disponibleCalculado(): number {
    if (!this.saldoEditando) return 0;
    return this.totalCalculado() - this.saldoEditando.DiasUsados;
  }

  guardar(): void {
    if (!this.saldoEditando) return;

    const payload = this.formEdicion.value;
    const anioAGuardar = payload.anio;
    this.ghService.actualizarSaldo(
      this.saldoEditando.id,
      anioAGuardar,
      payload
    ).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success', title: 'Saldo actualizado',
          timer: 1500, showConfirmButton: false,
        });
        this.cerrarModal();
        this.cargarSaldos();
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar' });
      },
    });
  }

  // ── CIERRE DE AnO ───────────────────────────────────────────────
  async cerrarAno(): Promise<void> {
    const anoSaliente = this.anoActual - 1;

    const conf = await Swal.fire({
      icon: 'warning',
      title: `¿Cerrar ano ${anoSaliente}?`,
      html: `
        Esta acción crea automáticamente las filas del ano <strong>${this.anoActual}</strong>
        para todos los empleados, con el arrastre de días no usados de <strong>${anoSaliente}</strong>.
        <br><br>
        Si ya existen filas para ${this.anoActual} no se sobrescriben.
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar ano',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });

    if (!conf.isConfirmed) return;

    this.ghService.cerrarAnoVacaciones(anoSaliente).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Ano cerrado',
          text: `Se generaron ${res.body?.filasCreadas ?? 0} filas para ${this.anoActual}`,
        });
        this.cargarSaldos();
        this.anioYaCerrado = true;
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cerrar el ano' });
      },
    });
  }

  // ── HELPERS DEL TEMPLATE ────────────────────────────────────────
  iniciales(nombre: string): string {
    if (!nombre) return '??';
    const partes = nombre.trim().split(' ');
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
  }
}