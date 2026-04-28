export interface Empleado {
  id: number;
  nombre: string;
  codigo: string;
  cedula?: string;
  telefonoFlota?: string;
  telefonoPersonal?: string;
  IdDepartamento: number;        // ← ID numérico para el form
  departamento: string;          // ← texto para mostrar en tabla
  IdCargo: number;               // ← ID numérico para el form
  cargo: string;                 // ← antes "posicion"
  ubicacion: string;
  localidad: string;
  estado: boolean;
  equipos?: EquipoAsignado[];
  stats: {
    metroSemana:         number;
    totalInteriorSemana: number;
    totalSedeSemana:     number;
    metroMes:            number;
    totalInterior:       number;
    totalSede:           number;
    diasNorte:           number;
    diasSur:             number;
    diasEste:            number;
  };
}
export interface EquipoAsignado {
  nombreEquipo: string;
  categoria: string;
  IdEquipo: number; // Opcional, pero útil para cuando vayas a editar
}
export interface TipoAsignacion {
  IdTipo: number;
  nombre: string;
}

export interface Asignacion {
  idAsignacion?: number;
  idEmpleado: number;
  idTipo: number;
  fecha: string;
}

export interface AsignacionCelda {
  uid: string; // ID único local para que Angular trackee correctamente el DOM
  idAsignacion: number | null;
  tipoId: number;
  cantidad: string;
  cantidadMetro: string;
  dias: string;
  zona: string;
  idEstado: number | null;
  modificado: boolean;
  guardadoOk: boolean;
  esNueva: boolean;
}
