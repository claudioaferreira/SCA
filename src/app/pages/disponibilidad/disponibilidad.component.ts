import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { GestionHumanaService } from '../../services/gestion-humana.service';

interface DisponibilidadEmpleado {
  id: number;
  nombre: string;
  codigo: string;
  ubicacion: string;
  localidad: string;
  cargo: string;
  Estado: 'disponible' | 'manual' | 'ausencia' | 'asignacion';
  Motivo: string | null;
  FechaInicio: string | null;
  FechaFin: string | null;
  IdEstadoManual: number | null;
}

@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './disponibilidad.component.html',
  styleUrl: './disponibilidad.component.scss',
})
export class DisponibilidadComponent implements OnInit {

  loading = false;
  empleados: DisponibilidadEmpleado[] = [];

  filtroTexto  = '';
  filtroEstado: 'todos' | 'disponible' | 'manual' | 'ausencia' | 'asignacion' = 'todos';

  modalAbierto = false;
  formBloqueo!: FormGroup;
  empleadosDisponibles: DisponibilidadEmpleado[] = [];
  fotoFallida = new Set<string>();
  hoy = new Date().toISOString().split('T')[0];

  private fb = inject(FormBuilder);
  private ghService = inject(GestionHumanaService); 

  ngOnInit(): void {
    this.construirForm();
    this.cargar();
  }

  private construirForm(): void {
    this.formBloqueo = this.fb.group({
      idEmpleado:  [null,     Validators.required],
      fechaInicio: [this.hoy, Validators.required],
      fechaFin:    [this.hoy, Validators.required],
      motivo:      ['',       [Validators.required, Validators.minLength(5)]],
    });
  }

  

 cargar(): void {
  this.loading = true;
  this.ghService.getDisponibilidadAhora().subscribe({
    next: (res) => {
      const datos = res.body ?? [];

      // 🔑 Normalizar Estado a minúscula
      this.empleados = datos.map((e: any) => ({
        ...e,
        Estado: (e.Estado ?? 'disponible').toLowerCase(),
      }));

      this.loading = false;
    },
    error: () => {
      this.loading = false;
      Swal.fire({ icon: 'error', title: 'Error al cargar', text: 'No se pudo conectar' });
    },
  });
}

  // ── CONTADORES ──────────────────────────────────────────────────
  get totalDisponibles(): number {
    return this.empleados.filter(e => e.Estado === 'disponible').length;
  }
  get totalOcupados(): number {
    return this.empleados.filter(e => e.Estado !== 'disponible').length;
  }
  contarPorEstado(estado: string): number {
    return this.empleados.filter(e => e.Estado === estado).length;
  }

  // ── FILTRO ──────────────────────────────────────────────────────
  empleadosFiltrados(): DisponibilidadEmpleado[] {
    const t = this.filtroTexto.toLowerCase().trim();
    return this.empleados.filter(e => {
      const okTexto = !t || e.nombre.toLowerCase().includes(t) || e.codigo.includes(t);
      const okEst   = this.filtroEstado === 'todos' || e.Estado === this.filtroEstado;
      return okTexto && okEst;
    });
  }

  // ── MODAL ───────────────────────────────────────────────────────
  abrirModalBloquear(prefill?: DisponibilidadEmpleado): void {
    this.empleadosDisponibles = this.empleados.filter(e => e.Estado === 'disponible');
    this.formBloqueo.reset({
      idEmpleado:  prefill?.id ?? null,
      fechaInicio: this.hoy,
      fechaFin:    this.hoy,
      motivo:      '',
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarBloqueo(): void {
  if (this.formBloqueo.invalid) {
    this.formBloqueo.markAllAsTouched();
    return;
  }

  this.ghService.bloquearEmpleado(this.formBloqueo.value).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success', title: 'Empleado bloqueado',
        timer: 1300, showConfirmButton: false,
      });
      this.cerrarModal();
      this.cargar();
    },
    error: (err) => {
      const msg = err?.error?.message ?? 'No se pudo bloquear';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    },
  });
}
async liberar(emp: DisponibilidadEmpleado): Promise<void> {
  if (emp.Estado !== 'manual' || !emp.IdEstadoManual) return;

  const conf = await Swal.fire({
    title: `¿Liberar a ${emp.nombre}?`,
    text:  emp.Motivo ?? '',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, liberar',
    cancelButtonText: 'Cancelar',
  });
  if (!conf.isConfirmed) return;

  this.ghService.liberarEmpleado(emp.IdEstadoManual).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success', title: 'Liberado',
        timer: 1200, showConfirmButton: false,
      });
      this.cargar();
    },
    error: () => {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo liberar' });
    },
  });
}

  // ── HELPERS DEL TEMPLATE ────────────────────────────────────────
  iniciales(nombre: string): string {
    if (!nombre) return '??';
    const p = nombre.trim().split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  formatFechaCorta(fechaStr: string | null): string {
  if (!fechaStr) return '';
  // Toma sólo "YYYY-MM-DD" del ISO completo
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${day} ${meses[month - 1]}`;
}

  onImgError(codigo: string): void {
  this.fotoFallida.add(codigo);
}

mostrarFoto(codigo: string): boolean {
  return !this.fotoFallida.has(codigo);
}

  iconoEstado(estado: string): string {
    switch (estado) {
      case 'disponible': return 'bi-check-circle-fill';
      case 'manual':     return 'bi-hand-thumbs-down-fill';
      case 'ausencia':   return 'bi-airplane-fill';
      case 'asignacion': return 'bi-truck';
      default:           return 'bi-question';
    }
  }

  textoEstado(estado: string): string {
    switch (estado) {
      case 'disponible': return 'Disponible';
      case 'manual':     return 'Bloqueado';
      case 'ausencia':   return 'Ausente';
      case 'asignacion': return 'En ruta';
      default:           return 'Desconocido';
    }
  }

  // ── MOCK DATA (sólo para preview) ────────────────────────────────
  // private generarMockData(): DisponibilidadEmpleado[] {
  //   return [
  //     { id: 1, nombre: 'Pedro Carrasco',         codigo: '19990045', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Soporte III',  Estado: 'disponible', Motivo: null, FechaInicio: null, FechaFin: null, IdEstadoManual: null },
  //     { id: 2, nombre: 'Joel Bismar de Oleo',    codigo: '20210119', ubicacion: 'Las Colinas', localidad: 'Taller Inf.', cargo: 'Soporte I',    Estado: 'asignacion', Motivo: 'Metro · Línea 2', FechaInicio: '2026-05-08', FechaFin: '2026-05-12', IdEstadoManual: null },
  //     { id: 3, nombre: 'María Gomez',            codigo: '20190290', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Auxiliar',     Estado: 'ausencia',   Motivo: 'Vacaciones',       FechaInicio: '2026-05-08', FechaFin: '2026-05-15', IdEstadoManual: null },
  //     { id: 4, nombre: 'Luis Crespo Duarte',     codigo: '20090218', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Soporte III',  Estado: 'manual',     Motivo: 'En reunión con cliente todo el día', FechaInicio: '2026-05-08', FechaFin: '2026-05-08', IdEstadoManual: 1 },
  //     { id: 5, nombre: 'Ana Montas',             codigo: '20160290', ubicacion: 'Taller',      localidad: 'Informática', cargo: 'Auxiliar',     Estado: 'disponible', Motivo: null, FechaInicio: null, FechaFin: null, IdEstadoManual: null },
  //     { id: 6, nombre: 'Pedro Wagner',           codigo: '20140050', ubicacion: 'Taller',      localidad: 'Informática', cargo: 'Soporte II',   Estado: 'manual',     Motivo: 'Capacitación interna',  FechaInicio: '2026-05-08', FechaFin: '2026-05-09', IdEstadoManual: 2 },
  //     { id: 7, nombre: 'Heidy Veloz',            codigo: '20191162', ubicacion: 'Las Colinas', localidad: 'Soporte',     cargo: 'Soporte I',    Estado: 'asignacion', Motivo: 'Interior · Norte', FechaInicio: '2026-05-07', FechaFin: '2026-05-10', IdEstadoManual: null },
  //     { id: 8, nombre: 'Carlos Betances',        codigo: '19960172', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Soporte III',  Estado: 'disponible', Motivo: null, FechaInicio: null, FechaFin: null, IdEstadoManual: null },
  //     { id: 9, nombre: 'Tomás Guerrero',         codigo: '19970048', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Soporte II',   Estado: 'disponible', Motivo: null, FechaInicio: null, FechaFin: null, IdEstadoManual: null },
  //     { id: 10, nombre: 'Suhey Anselmo',         codigo: '20020050', ubicacion: 'JEDN',        localidad: 'Soporte',     cargo: 'Soporte I',    Estado: 'ausencia',   Motivo: 'Permiso lactancia',     FechaInicio: '2026-05-08', FechaFin: '2026-05-08', IdEstadoManual: null },
  //   ];
  // }
}