export interface Empleado {
  id: number;
  nombre: string;
  codigo: string;
  cedula?: string;
  telefonoFlota?: string;
  telefonoPersonal?: string;
  departamento: string;
  ubicacion: string;
  localidad: string;
  posicion?: string;
  estado: boolean;
  equipos?: EquipoAsignado[];
  stats: {
    // SEMANA
    metroSemana:         number;
    totalInteriorSemana: number;
    totalSedeSemana:     number;

    // HISTÓRICO / MES
    metroMes:      number;
    totalInterior: number;
    totalSede:     number;

    diasNorte: number;
    diasSur:   number;
    diasEste:  number;
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
