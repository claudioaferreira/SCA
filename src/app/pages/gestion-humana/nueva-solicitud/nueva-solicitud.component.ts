import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { EmpleadosService } from '../../../services/empleados.service';
import { GestionHumanaService } from '../../../services/gestion-humana.service';

@Component({
  selector: 'app-nueva-solicitud',
  standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-solicitud.component.html',
  styleUrl: './nueva-solicitud.component.scss'
})
export class NuevaSolicitudComponent implements OnInit {

   // ── ESTADO ──────────────────────────────────────────────────────────
  loading = false;


  // Catálogos
  tipos:               any[] = [];
  subtiposPermiso:     any[] = [];
  subtiposLicencia:    any[] = [];
  subtiposIncidencia:  any[] = [];
  empleados:           any[] = [];
  aniosDisponibles: any[] = [];
  aniosFiltro: number[] = [];
  

   // Saldo de vacaciones (se carga cuando el empleado cambia y el tipo = 4)
  saldoVacaciones: any = null;

  // ── FORMULARIO REACTIVO ─────────────────────────────────────────────
  formulario!: FormGroup;

    // ── INYECCIÓN ───────────────────────────────────────────────────────
  private fb           = inject(FormBuilder);
  private ghService    = inject(GestionHumanaService);
  private empService   = inject(EmpleadosService);
  private router       = inject(Router);

  ngOnInit(): void {
       this.construirFormulario();
       this.suscribirCambiosFechas();
    this.cargarCatalogos();
    this.cargarEmpleados();
  }

  // ── CONSTRUCCIÓN DEL FORM ───────────────────────────────────────────
  /**
   * Un único FormGroup con TODOS los campos posibles.
   * En el HTML mostramos/ocultamos las secciones según el tipo elegido.
   * Al guardar, mandamos al backend sólo los campos relevantes.
   */
  private construirFormulario(): void {
    this.formulario = this.fb.group({
      // Comunes
      idEmpleado:        [null, Validators.required],
      idTipoSolicitud:   [null, Validators.required],
      idEstadoSolicitud: [2],                    // 2 = Aprobada (ya viene firmada)
      comentarios:       [''],

      // Toggle: el Permiso es por horas o por día completo
      esPorHoras: [false],

      // Ausencia (Permiso día completo, Licencia, Vacaciones)
      idSubtipoPermiso:    [null],
      idSubtipoLicencia:   [null],
      cantidadDias:        [null],
      fechaInicio:         [''],
      fechaReintegro:      [''],
      anioCorrespondiente:  [new Date().getFullYear()],
      especificarOtro:     [''],
      documentoEntregado:  [false],

      // Permiso por horas
      cantidadHoras:  [null],
      horarioInicio:  [''],
      horarioFin:     [''],
      fechaPermiso:   [''],

      // Incidencia
      idSubtipoIncidencia: [null],
      horaEvento:          [''],
      fechaEvento:         [''],
      justificado:         [false],
      motivo:              [''],
    });
  }

  // ── AUTO-CÁLCULO DE FECHAS ──────────────────────────────────────────
  private suscribirCambiosFechas(): void {
    // Escuchamos todo el formulario de forma global
    this.formulario.valueChanges.subscribe((valores) => {
      this.calcularReintegro(valores.cantidadDias, valores.fechaInicio);
    });
  }

  private calcularReintegro(diasVal: any, inicioStr: any): void {
    const dias = Number(diasVal);

    // Solo calculamos si hay un número de días válido y una fecha de inicio seleccionada
    if (dias > 0 && inicioStr) {
      const [año, mes, dia] = inicioStr.split('-').map(Number);
      const fechaCalculada = new Date(año, mes - 1, dia);

      // Sumar los días a la fecha de inicio
      fechaCalculada.setDate(fechaCalculada.getDate() + dias);

      // Formatear al formato que entiende el input type="date" (YYYY-MM-DD)
      const m = String(fechaCalculada.getMonth() + 1).padStart(2, '0');
      const d = String(fechaCalculada.getDate()).padStart(2, '0');
      const reintegroStr = `${fechaCalculada.getFullYear()}-${m}-${d}`;

      // Actualizar el formulario SOLAMENTE si la fecha calculada es distinta a la que ya está,
      // esto evita un bucle infinito (loop) de actualizaciones.
      if (this.formulario.get('fechaReintegro')?.value !== reintegroStr) {
        this.formulario.patchValue({ fechaReintegro: reintegroStr }, { emitEvent: false });
        console.log(`✅ Reintegro auto-calculado: ${reintegroStr}`); // Te servirá para verificar en F12
      }
    } else {
      // Si el usuario borra los días o la fecha de inicio, limpiamos el reintegro
      if (this.formulario.get('fechaReintegro')?.value) {
        this.formulario.patchValue({ fechaReintegro: '' }, { emitEvent: false });
      }
    }
  }

   // ── CARGA DE DATOS DEL BACKEND ─────────────────────────────────────
  private cargarCatalogos(): void {
    this.ghService.getTipos().subscribe({
      next: (res) => this.tipos = res.body ?? [],
    });
    this.ghService.getSubtiposPermiso().subscribe({
      next: (res) => this.subtiposPermiso = res.body ?? [],
    });
    this.ghService.getSubtiposLicencia().subscribe({
      next: (res) => this.subtiposLicencia = res.body ?? [],
    });
    this.ghService.getSubtiposIncidencia().subscribe({
      next: (res) => this.subtiposIncidencia = res.body ?? [],
    });
  }

    private cargarEmpleados(): void {
    this.empService.getEmpleadosActivos().subscribe({
      next: (data) => this.empleados = data ?? [],
    });
  }

  /** Cuando cambia el tipo, limpia los campos de los OTROS tipos */
  onTipoChange(): void {
    const tipo = Number(this.formulario.value.idTipoSolicitud);

    // Limpiar siempre los campos de "otros tipos"
    this.formulario.patchValue({
      idSubtipoPermiso: null,
      idSubtipoLicencia: null,
      idSubtipoIncidencia: null,
      esPorHoras: false,
      cantidadDias: null,
      cantidadHoras: null,
      horarioInicio: '',
      horarioFin: '',
      fechaPermiso: '',
      fechaInicio: '',
      fechaReintegro: '',
      horaEvento: '',
      fechaEvento: '',
      especificarOtro: '',
      motivo: '',
      justificado: false,
      documentoEntregado: false,
    });

    // Si es Vacaciones y ya hay empleado, traer saldo
   if (tipo === 4 && this.formulario.value.idEmpleado) {
    this.cargarSaldoVacaciones();
    this.cargarAniosDisponibles();
  } else {
    this.saldoVacaciones = null;
    this.aniosDisponibles = [];
  }
}
  

  /** Cuando cambia el empleado, si es Vacaciones recargá el saldo */
  onEmpleadoChange(): void {
  const tipo = Number(this.formulario.value.idTipoSolicitud);
  if (tipo === 4) {
    this.cargarSaldoVacaciones();
    this.cargarAniosDisponibles();    // ← agregar
  }
  }

  private cargarAniosDisponibles(): void {
  const id = Number(this.formulario.value.idEmpleado);
  if (!id) return;

  this.ghService.getAniosDisponiblesEmpleado(id).subscribe({
    next: (res) => {
      this.aniosDisponibles = res.body ?? [];
      // Resetear el campo si el año actual no está disponible
      const anioActual = this.formulario.value.anioCorrespondiente;
      if (anioActual && !this.aniosDisponibles.some(a => a.Anio === anioActual)) {
        this.formulario.patchValue({ anioCorrespondiente: null });
      }
    },
  });
}
   private cargarSaldoVacaciones(): void {
    const idEmpleado = Number(this.formulario.value.idEmpleado);
    if (!idEmpleado) return;

    this.ghService.getSaldoVacaciones(idEmpleado).subscribe({
      next: (res) => this.saldoVacaciones = res.body,
    });
  }

  // ── HELPERS PARA EL TEMPLATE ────────────────────────────────────────
  get tipoSeleccionado(): number {
    return Number(this.formulario.value.idTipoSolicitud) || 0;
  }

  esTipoPermiso():    boolean { return this.tipoSeleccionado === 1; }
  esTipoLicencia():   boolean { return this.tipoSeleccionado === 2; }
  esTipoIncidencia(): boolean { return this.tipoSeleccionado === 3; }
  esTipoVacaciones(): boolean { return this.tipoSeleccionado === 4; }

  // ── GUARDAR ─────────────────────────────────────────────────────────
  async guardar(): Promise<void> {
    // Validación del FormGroup base
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Completá los campos marcados',
        timer: 2000, showConfirmButton: false,
      });
      return;
    }

    // Validación específica por tipo
    const error = this.validarPorTipo();
    if (error) {
      Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: error });
      return;
    }

    // Para vacaciones: chequear saldo
    if (this.esTipoVacaciones() && this.saldoVacaciones) {
  const dias  = Number(this.formulario.value.cantidadDias);
  const saldo = this.saldoVacaciones.DiasDisponibles;

  if (dias > saldo) {
    Swal.fire({
      icon: 'error',
      title: 'Saldo insuficiente',
      html: `
        Sólo tiene <strong>${saldo}</strong> días disponibles.<br>
        Está intentando registrar <strong>${dias}</strong>.
      `,
    });
    return;
  }

  if (saldo - dias <= 3) {
    const confirma = await Swal.fire({
      icon: 'warning',
      title: 'Saldo bajo',
      html: `Después de esto le quedarán <strong>${saldo - dias}</strong> días.<br>¿Continuar?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirma.isConfirmed) return;
  }
}

    // Enviar
    this.loading = true;
    this.ghService.crearSolicitud(this.formulario.value).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Solicitud guardada',
          timer: 1500, showConfirmButton: false,
        });
        this.router.navigate(['/gestion-humana/solicitudes']);
      },
      error: (err) => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar' });
        this.loading = false;
      },
    });
  }

  /** Validación específica según el tipo elegido. Devuelve mensaje o null. */
  private validarPorTipo(): string | null {
    const v = this.formulario.value;

    if (this.esTipoPermiso()) {
      if (!v.idSubtipoPermiso) return 'Seleccioná el subtipo de permiso';

      if (v.esPorHoras) {
        if (!v.cantidadHoras) return 'Falta la cantidad de horas';
        if (!v.horarioInicio) return 'Falta el horario de inicio';
        if (!v.horarioFin)    return 'Falta el horario de fin';
        if (!v.fechaPermiso)  return 'Falta la fecha del permiso';
      } else {
        if (!v.cantidadDias)   return 'Falta la cantidad de días';
        if (!v.fechaInicio)    return 'Falta la fecha de inicio';
        if (!v.fechaReintegro) return 'Falta la fecha de reintegro';
      }
    }

    if (this.esTipoLicencia()) {
      if (!v.idSubtipoLicencia) return 'Seleccioná el subtipo de licencia';
      if (!v.cantidadDias)      return 'Falta la cantidad de días';
      if (!v.fechaInicio)       return 'Falta la fecha de inicio';
      if (!v.fechaReintegro)    return 'Falta la fecha de reintegro';
    }

    if (this.esTipoIncidencia()) {
      if (!v.idSubtipoIncidencia) return 'Seleccioná el tipo de incidencia';
      if (!v.fechaEvento)         return 'Falta la fecha del evento';
    }

    if (this.esTipoVacaciones()) {
      if (!v.cantidadDias)        return 'Falta la cantidad de días';
      if (!v.fechaInicio)         return 'Falta la fecha de inicio';
      if (!v.fechaReintegro)      return 'Falta la fecha de reintegro';
      if (!v.anioCorrespondiente)  return 'Falta el año correspondiente';
    }

    return null;
  }

  // ── NAVEGACIÓN ──────────────────────────────────────────────────────
  cancelar(): void {
    this.router.navigate(['/gestion-humana/solicitudes']);
  }

  // ── HELPERS DE TEMPLATE PARA MOSTRAR ERRORES ────────────────────────
  campoInvalido(nombre: string): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.invalid && c.touched;
  }

}
