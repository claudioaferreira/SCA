export interface Empleado {
  id: number;
  nombre: string;
  codigo: string;
  cedula?: string;     // Opcional por ahora
  telefonoFlota?: string;
  telefonoPersonal?: string;
  ubicacion: string;  // Opcional
  localidad: string;
  posicion?: string;
  estado: boolean;
  TieneData: boolean;
  TieneOutlook: boolean;
  TieneTeams: boolean;
  tieneUSB: boolean;
  stats: {
    totalInterior?: number;
    totalSede?: number;
    metroMes?: number;
    diasNorte?: number;
    diasSur?: number;
    diasEste?: number;
  };
}

export interface TipoAsignacion {
  idTipo: number;
  nombre: string;
}

export interface Asignacion {
  idAsignacion?: number;
  idEmpleado: number;
  idTipo: number;
  fecha: string; // Formato ISO YYYY-MM-DD para fácil manejo
}


export interface AsignacionCelda {
  idAsignacion: number | null; // null = aún no guardada en BD
  tipoId: number;
  cantidad: string;
  cantidadMetro: string;
  dias: string;
  zona: string;
  idEstado: number | null;     // 1=Ocupado, 3=Completado/Disponible
  modificado: boolean;         // true = hay cambios pendientes de guardar
  guardadoOk: boolean;         // true = se acaba de guardar (feedback visual)
  esNueva: boolean;            // true = formulario abierto, aún sin guardar
}