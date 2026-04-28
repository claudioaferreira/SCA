import { Component, inject, OnInit } from '@angular/core';
import { FormsModule,  ReactiveFormsModule, FormBuilder, FormGroup, Validators  } from '@angular/forms';
import { EmpleadosService } from '../../../services/empleados.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import {
  Empleado,
  TipoAsignacion,
  AsignacionCelda,
} from '../../../interfaces/asignacion.interface';


@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss'],
})
export class EmpleadosComponent implements OnInit {

  empleadosMaster: Empleado[] = [];
  equiposDisponibles: any[] = [];
  equiposSeleccionados: number[] = [];
  departamentosCatalogo: any[] = [];
  cargosCatalogo: any[] = [];
  private empleadoIdActual = 0

  private _empleadosService = inject(EmpleadosService);
  private _fb = inject(FormBuilder);
  formulario!: FormGroup;

  
  // ── FILTROS ───────────────────────────────────────────────────────────────
  textoBusqueda = '';
  filtroDepartamento = '';

  ngOnInit() {
    this.cargarCatalogoEquipos();
    this.cargarExtras();
    this.cargarEmpleadosDeAPI();

  }

  // Getter: devuelve la lista filtrada según lo que el usuario escribió
  empleadosFiltrados() {
    return this.empleadosMaster.filter((emp) => {
      const coincideTexto = emp.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) || emp.codigo.includes(this.textoBusqueda);
      const coincideDepartamento = this.filtroDepartamento ? emp.localidad === this.filtroDepartamento : true;
      return coincideTexto && coincideDepartamento;
    });
  }
  
  cargarExtras() {
    this._empleadosService.getDepartamentos().subscribe({
      next: (data) => {
         console.log('Primer depto:', data[0]); //
        this.departamentosCatalogo = data;
      },
      error: (err) => console.error('Error al cargar departamentos', err)
    });
    this._empleadosService.getCargos().subscribe({
      next: (data) => {
        console.log('Primer cargo:', data[0]); // 
        this.cargosCatalogo = data;
      },
      error: (err) => console.error('Error al cargar cargos', err)
    });
  }

  // Carga los empleados desde la API
  cargarEmpleadosDeAPI() {
    this._empleadosService.getEmpleados().subscribe({
      next: (data) => {
        // Mapeamos los datos para convertir el string de SQL en un Arreglo real
        this.empleadosMaster = data.map((emp: any) => {
          // Si SQL mandó los equipos como texto, los convertimos a JSON
          if (typeof emp.equipos === 'string') {
            try {
              emp.equipos = JSON.parse(emp.equipos);
            } catch (e) {
              emp.equipos = []; // Si hay error o viene nulo, ponemos un arreglo vacío
            }
          }
          return emp;
        });
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
      },
    });
  }
  cargarCatalogoEquipos() {
  this._empleadosService.getCatalogoEquipos().subscribe({
    next: (data) => {
      this.equiposDisponibles = data;
    },
    error: (err) => console.error('Error al cargar equipos', err)
  });
}

verificarSiTieneEquipo(IdEquipo: number): boolean {
    return this.equiposSeleccionados.includes(IdEquipo);
  }
// ── LÓGICA DE CHECKBOXES ──────────────────────────────────────────────────
 
  // ¿Está este equipo marcado? Angular lo llama en cada checkbox del template.
  estaSeleccionado(IdEquipo: number): boolean {
    return this.equiposSeleccionados.includes(IdEquipo);
  }
 
  // El usuario marca o desmarca un checkbox → actualizamos el array.
  toggleEquipo(IdEquipo: number, event: Event) {
    const marcado = (event.target as HTMLInputElement).checked;
    if (marcado) {
      // Evitamos duplicados por si acaso
      if (!this.equiposSeleccionados.includes(IdEquipo)) {
        this.equiposSeleccionados.push(IdEquipo);
      }
    } else {
      this.equiposSeleccionados = this.equiposSeleccionados.filter(id => id !== IdEquipo);
    }
  }
  toggleEquipoManual(IdEquipo: number) {
    if (this.equiposSeleccionados.includes(IdEquipo)) {
      // Si ya lo tiene, lo quitamos
      this.equiposSeleccionados = this.equiposSeleccionados.filter(id => id !== IdEquipo);
    } else {
      // Si no lo tiene, lo agregamos
      this.equiposSeleccionados.push(IdEquipo);
    }
  }
  // ── MODAL ─────────────────────────────────────────────────────────────────
  mostrarModal = false;
  editando = false;

  // Objeto del formulario — se llena al abrir el modal
  //form: Empleado = this.formVacio();

  // Retorna un empleado vacío para el formulario de "Nuevo"
  private construirForm(emp?: Empleado): void {
  this.formulario = this._fb.group({
    nombre:          [emp?.nombre          ?? '', [Validators.required, Validators.minLength(3)]],
    codigo:          [emp?.codigo          ?? '', [Validators.required]],
    telefonoFlota:   [emp?.telefonoFlota   ?? ''],
    telefonoPersonal:[emp?.telefonoPersonal?? ''],
    departamento:    [emp?.IdDepartamento  ?? '', [Validators.required]], // ← ID
    cargo:           [emp?.IdCargo         ?? '', [Validators.required]], // ← antes "posicion"
    estado:          [emp?.estado          ?? true],
  });

  if (emp) {
    this.formulario.get('nombre')?.disable();
    this.formulario.get('codigo')?.disable();
  }
}

  // ── ACCIONES ──────────────────────────────────────────────────────────────

  // Abre el modal en modo "Nuevo"
  abrirNuevo() {
    this.editando = false;
    this.empleadoIdActual = 0;
    //this.form = this.formVacio();
    this.equiposSeleccionados = [];
     this.construirForm();
    this.mostrarModal = true;
  }

  // Abre el modal en modo "Editar" con los datos del empleado seleccionado
  abrirEditar(emp: Empleado) {
  this.editando = true;
  this.empleadoIdActual = emp.id;
  this.construirForm(emp);
  this.equiposSeleccionados = (emp.equipos ?? [])
    .map((eq: any) => Number(eq.IdEquipo))
    .filter((id: number) => !isNaN(id) && id > 0);
  this.mostrarModal = true;
}


  /// Guarda (crea o actualiza) el empleado
  guardar() {
  this.formulario.markAllAsTouched();
  if (this.formulario.invalid) return;

  const raw = this.formulario.getRawValue();

const payload = {
  id:               this.empleadoIdActual,
  nombre:           raw.nombre,
  codigo:           raw.codigo,
  telefonoFlota:    raw.telefonoFlota    || '',
  telefonoPersonal: raw.telefonoPersonal || '',
  IdDepartamento:   Number(raw.departamento),
  IdCargo:          Number(raw.cargo),
  ubicacion:        raw.ubicacion        || '',
  localidad:        raw.localidad        || '',
  estado:           raw.estado,
  equiposIds:       this.equiposSeleccionados
};

    
     console.log('Payload a enviar al backend:', payload);

    // 2. Mostramos la alerta de carga bloqueando la pantalla
    Swal.fire({
      title: 'Guardando...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    // 3. Enviamos los datos al backend a través de tu servicio
    this._empleadosService.guardarEmpleado(payload).subscribe({
      next: (resp) => {
        // Evaluamos la respuesta estandarizada que creamos en tu controlador
        if (!resp.error) {
          // Mostramos mensaje de éxito (esto cierra automáticamente el loading anterior)
          Swal.fire('¡Éxito!', 'Empleado guardado correctamente', 'success');
          
          // Cerramos el modal
          this.cerrarModal();
          
          // Recargamos la tabla directamente desde la base de datos 
          // para que traiga los nombres de los equipos y todo actualizado
          this.cargarEmpleadosDeAPI(); 
        } else {
          // Si el backend devolvió un error controlado
          Swal.fire('Error', resp.message || 'Error al guardar', 'error');
        }
      },
      error: (err) => {
        console.error('Error en la petición HTTP:', err);
        Swal.fire('Error', 'Hubo un problema de comunicación con el servidor', 'error');
      }
    });
  }

  // Elimina un empleado por su ID
 eliminar(id: number) {
     Swal.fire({
      title: '¿Eliminar empleado?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
