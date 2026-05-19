import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importamos FormsModule para binding [(ngModel)]
import { UserService } from '../../../services/user/user.service';
import { PermisosService } from '../../../services/permisos.service';
import { Rol } from '../../../interfaces/asignacion.interface';

interface Permiso {
  IdPermiso:   number;
  clave:       string;
  descripcion: string;
  modulo:      string;
}

interface GrupoPermiso {
  modulo:   string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule], // Agregamos FormsModule aquí
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.scss',
})
export class PermisosComponent implements OnInit {

  private userService     = inject(UserService);
  private permisosService = inject(PermisosService);

  roles: Rol[]                = [];
  rolSeleccionado: Rol | null = null;
  grupos: GrupoPermiso[]      = [];

  // Set con los IdPermiso (números) que tiene el rol seleccionado
  permisosDelRol = new Set<number>();

  // Caché del catálogo para no pedirlo cada vez que cambias de rol
  todosLosPermisos: Permiso[] = [];

  cargandoRoles    = false;
  cargandoPermisos = false;

  // ==========================================
  // ESTADOS DEL BUSCADOR Y PANEL INTERACTIVO
  // ==========================================
  filtroBusqueda = '';                  // Almacena el texto escrito en la barra de búsqueda
  modulosColapsados = new Set<string>(); // Colección de módulos que están cerrados/colapsados
  permisosEnProceso = new Set<number>(); // Contiene los ID de permisos que se están guardando en el backend en este instante

  // ==========================================
  // ESTADOS DEL NUEVO MODAL PERSONALIZADO
  // ==========================================
  mostrarModalCrear = false; // Controla si se dibuja el modal en pantalla
  pasoModal = 1;             // Controla qué paso está activo (Paso 1 o Paso 2)

  // Variables para enlazar los campos del Paso 1 con [(ngModel)]
  nuevoPermisoClave = '';
  nuevoPermisoDesc = '';
  nuevoPermisoModulo = '';

  // Variables obtenidas tras guardar en el Paso 1
  nuevoPermisoId: number | null = null;

  // Variable para enlazar el rol del Paso 2 con [(ngModel)]
  rolSeleccionadoParaAsignar: number | null = null;

  // Indicadores de carga para que el usuario visualice la acción
  guardandoPaso1 = false;
  guardandoPaso2 = false;

  // Mensaje de error a mostrar localmente dentro del modal
  errorModal = '';

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargandoRoles = true;
    this.userService.getRoles().subscribe({
      next: (res) => {
        this.roles         = res.body ?? [];
        this.cargandoRoles = false;
      },
      error: () => { this.cargandoRoles = false; },
    });
  }

  seleccionarRol(rol: Rol): void {
    this.rolSeleccionado  = rol;
    this.cargandoPermisos = true;
    this.grupos           = [];
    this.permisosDelRol.clear();
    this.modulosColapsados.clear(); // Resetear colapsados al cambiar de rol
    this.filtroBusqueda = '';        // Resetear buscador

    if (this.todosLosPermisos.length > 0) {
      // Catálogo ya en caché → solo pedir los del rol
      this.armarGrupos(this.todosLosPermisos);
      this.cargarPermisosDelRol(rol.IdRol);
      return;
    }

    // Primera vez → pedir el catálogo completo
    this.permisosService.getTodos().subscribe({
      next: (todos: Permiso[]) => {
        this.todosLosPermisos = todos;
        this.armarGrupos(todos);
        this.cargarPermisosDelRol(rol.IdRol);
      },
      error: () => { this.cargandoPermisos = false; },
    });
  }

  private armarGrupos(todos: Permiso[]): void {
    const mapa: Record<string, Permiso[]> = {};
    for (const p of todos) {
      if (!mapa[p.modulo]) mapa[p.modulo] = [];
      mapa[p.modulo].push(p);
    }
    this.grupos = Object.entries(mapa).map(([modulo, permisos]) => ({ modulo, permisos }));
  }

  private cargarPermisosDelRol(IdRol: number): void {
    this.permisosService.getDelRol(IdRol).subscribe({
      next: (permisos: Permiso[]) => {
        // El backend devuelve objetos → extraemos solo los IdPermiso para el Set
        this.permisosDelRol   = new Set<number>(permisos.map(p => p.IdPermiso));
        this.cargandoPermisos = false;
      },
      error: () => { this.cargandoPermisos = false; },
    });
  }

  tienePermiso(IdPermiso: number): boolean {
    return this.permisosDelRol.has(IdPermiso);
  }

  togglePermiso(permiso: Permiso): void {
    if (!this.rolSeleccionado) return;
    const IdRol = this.rolSeleccionado.IdRol;
    const IdPermiso = permiso.IdPermiso;

    // Registramos que este permiso está en proceso de cambio (muestra spinner en la fila)
    this.permisosEnProceso.add(IdPermiso);

    if (this.tienePermiso(IdPermiso)) {
      this.permisosService.quitar(IdRol, IdPermiso).subscribe({
        next: () => {
          this.permisosDelRol.delete(IdPermiso);
          // Forzar detección de cambios en el Set
          this.permisosDelRol = new Set(this.permisosDelRol);
          this.permisosEnProceso.delete(IdPermiso); // Quitar estado de carga
        },
        error: (err) => {
          this.permisosEnProceso.delete(IdPermiso); // Quitar estado de carga
          alert(err?.error?.message ?? 'No se pudo quitar el permiso');
        },
      });
    } else {
      this.permisosService.asignar(IdRol, IdPermiso).subscribe({
        next: () => {
          this.permisosDelRol.add(IdPermiso);
          this.permisosDelRol = new Set(this.permisosDelRol);
          this.permisosEnProceso.delete(IdPermiso); // Quitar estado de carga
        },
        error: (err) => {
          this.permisosEnProceso.delete(IdPermiso); // Quitar estado de carga
          alert(err?.error?.message ?? 'No se pudo asignar el permiso');
        },
      });
    }
  }

  // ==========================================
  // MÉTODOS DEL BUSCADOR Y PANEL INTERACTIVO
  // ==========================================

  /**
   * Evalúa si un permiso cumple con el filtro de búsqueda actual
   */
  cumpleFiltro(permiso: Permiso): boolean {
    if (!this.filtroBusqueda) return true;
    const query = this.filtroBusqueda.toLowerCase().trim();
    return (
      permiso.descripcion.toLowerCase().includes(query) ||
      permiso.clave.toLowerCase().includes(query) ||
      permiso.modulo.toLowerCase().includes(query)
    );
  }

  /**
   * Determina si un módulo (grupo) contiene al menos un permiso que cumpla el filtro
   * Esto sirve para ocultar secciones completas de módulos si la búsqueda no coincide.
   */
  grupoTienePermisosVisibles(grupo: GrupoPermiso): boolean {
    return grupo.permisos.some(p => this.cumpleFiltro(p));
  }

  /**
   * Retorna true si hay al menos un resultado en toda la lista de grupos.
   * Si es false, se muestra un mensaje amigable indicando que no se hallaron registros.
   */
  hayResultadosDeBusqueda(): boolean {
    if (!this.filtroBusqueda) return true;
    return this.grupos.some(grupo => this.grupoTienePermisosVisibles(grupo));
  }

  /**
   * Cuenta cuántos permisos activos existen dentro de un módulo/grupo
   */
  obtenerActivosEnGrupo(grupo: GrupoPermiso): number {
    return grupo.permisos.filter(p => this.tienePermiso(p.IdPermiso)).length;
  }

  /**
   * Alterna el estado de colapsado (abierto/cerrado) de un módulo
   */
  toggleModulo(modulo: string): void {
    if (this.modulosColapsados.has(modulo)) {
      this.modulosColapsados.delete(modulo);
    } else {
      this.modulosColapsados.add(modulo);
    }
  }

  /**
   * Retorna true si el módulo está colapsado (cerrado)
   */
  moduloEstaColapsado(modulo: string): boolean {
    return this.modulosColapsados.has(modulo);
  }

  /**
   * Controles rápidos para expandir o colapsar todos los módulos de golpe
   */
  toggleTodosLosModulos(colapsar: boolean): void {
    if (colapsar) {
      this.grupos.forEach(grupo => this.modulosColapsados.add(grupo.modulo));
    } else {
      this.modulosColapsados.clear();
    }
  }

  /**
   * Determina si un permiso específico está guardando datos en este momento
   */
  estaEnProceso(IdPermiso: number): boolean {
    return this.permisosEnProceso.has(IdPermiso);
  }

  // ==========================================
  // MÉTODOS DEL MODAL PERSONALIZADO
  // ==========================================

  /**
   * Abre el modal y reinicia todos sus valores y estados a sus valores por defecto
   */
  abrirModalCrearPermiso(): void {
    this.mostrarModalCrear = true;
    this.pasoModal = 1;
    this.nuevoPermisoClave = '';
    this.nuevoPermisoDesc = '';
    this.nuevoPermisoModulo = '';
    this.nuevoPermisoId = null;
    this.rolSeleccionadoParaAsignar = null;
    this.guardandoPaso1 = false;
    this.guardandoPaso2 = false;
    this.errorModal = '';
  }

  /**
   * Cierra el modal y limpia la caché para obligar a refrescar la interfaz
   */
  cerrarModalCrearPermiso(): void {
    this.mostrarModalCrear = false;
    this.todosLosPermisos = []; // Forzamos limpieza de caché local
    
    // Si tenemos un rol cargado actualmente en la pantalla, lo refrescamos de inmediato
    if (this.rolSeleccionado) {
      this.seleccionarRol(this.rolSeleccionado);
    }
  }

  /**
   * Ejecuta el PASO 1: Inserta el permiso base en la tabla global [Permisos]
   */
  guardarPaso1(): void {
    const clave = this.nuevoPermisoClave.trim();
    const descripcion = this.nuevoPermisoDesc.trim();
    const modulo = this.nuevoPermisoModulo.trim();

    // Validación manual clara y entendible
    if (!clave || !descripcion || !modulo) {
      this.errorModal = 'Todos los campos con asterisco (*) son obligatorios';
      return;
    }

    this.errorModal = '';
    this.guardandoPaso1 = true;

    // Ejecutamos la petición al servicio
    this.permisosService.crearPermiso({ clave, descripcion, modulo }).subscribe({
      next: (respuesta) => {
        this.nuevoPermisoId = respuesta.IdPermiso; // Almacenamos el ID creado
        this.guardandoPaso1 = false;
        this.pasoModal = 2; // Avanzamos automáticamente al paso de asignación de rol
      },
      error: (err) => {
        this.guardandoPaso1 = false;
        this.errorModal = err?.error?.message ?? 'No se pudo registrar el permiso. Valida si la clave ya existe.';
      }
    });
  }

  /**
   * Ejecuta el PASO 2: Asigna el permiso nuevo al rol seleccionado en [Rol_Permisos]
   */
  guardarPaso2(): void {
    if (!this.nuevoPermisoId || !this.rolSeleccionadoParaAsignar) {
      this.errorModal = 'Por favor, selecciona un rol de la lista';
      return;
    }

    this.errorModal = '';
    this.guardandoPaso2 = true;

    this.permisosService.asignar(this.rolSeleccionadoParaAsignar, this.nuevoPermisoId).subscribe({
      next: () => {
        this.guardandoPaso2 = false;
        this.cerrarModalCrearPermiso(); // Cierra el modal y refresca la pantalla
        alert('¡Proceso Exitoso! El permiso fue creado y asignado al rol correctamente.');
      },
      error: (err) => {
        this.guardandoPaso2 = false;
        this.errorModal = err?.error?.message ?? 'El permiso se creó, pero no se pudo asociar al rol.';
      }
    });
  }

  /**
   * Ocurre si el usuario decide omitir el paso 2
   */
  omitirAsignacionPaso2(): void {
    this.cerrarModalCrearPermiso(); // Solo cerramos y refrescamos la lista
  }
}
