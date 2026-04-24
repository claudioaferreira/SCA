import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, CommonModule],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss'],
})
export class EmpleadosComponent implements OnInit {

  empleadosMaster: Empleado[] = [];
  equiposDisponibles: any[] = [];
  equiposSeleccionados: number[] = [];
  departamentosCatalogo: any[] = [];
  cargosCatalogo: any[] = [];


  private _empleadosService = inject(EmpleadosService);


  
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
        this.departamentosCatalogo = data;
      },
      error: (err) => console.error('Error al cargar departamentos', err)
    });
    this._empleadosService.getCargos().subscribe({
      next: (data) => {
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
  form: Empleado = this.formVacio();

  // Retorna un empleado vacío para el formulario de "Nuevo"
  private formVacio(): Empleado {
    return {
      id: 0,
      nombre: '',
      codigo: '',
      ubicacion: '',
      localidad: '',
      departamento: '',
      estado: false,
      equipos: [], // Arreglo vacío por defecto
      stats: {
        totalInterior: undefined,
        totalSede: undefined,
        metroMes: undefined,
        diasNorte: undefined,
        diasSur: undefined,
        diasEste: undefined,
      },
    };
  }

  // ── ACCIONES ──────────────────────────────────────────────────────────────

  // Abre el modal en modo "Nuevo"
  abrirNuevo() {
    this.editando = false;
    this.form = this.formVacio();
    this.equiposSeleccionados = []; // NUEVO: Limpiamos los checkboxes
    this.mostrarModal = true;
  }

  // Abre el modal en modo "Editar" con los datos del empleado seleccionado
  abrirEditar(emp: Empleado) {
    this.editando = true;
    this.form     = { ...emp };
 
    // ─────────────────────────────────────────────────────────────────────
    // CORRECCIÓN CLAVE: cada item de emp.equipos ahora tiene { IdEquipo, nombreEquipo, categoria }
    // gracias al fix en el SQL. Aquí extraemos solo los IDs para los checkboxes.
    // ─────────────────────────────────────────────────────────────────────
    this.equiposSeleccionados = (emp.equipos ?? [])
      .map((eq: any) => Number(eq.IdEquipo))   // convertimos a number por seguridad
      .filter((id: number) => !isNaN(id) && id > 0); // descartamos valores inválidos
    // console.log('Equipos seleccionados al abrir editar:', this.equiposSeleccionados);
    this.mostrarModal = true;
  }
  // Guarda (crea o actualiza) el empleado
  guardar() {
    // 1. Preparamos el payload (corregí el pequeño error de tipeo 'paypload')
    const payload = {
      ...this.form,
      equiposIds: this.equiposSeleccionados 
    };
    
    // console.log('Payload a enviar al backend:', payload);

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
