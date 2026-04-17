export interface Empleado {
  id: number;
  codigo: string;
  nombre: string;
  cedula?: string;     // Opcional por ahora
  ubicacion?: string;  // Opcional
  localidad: string;
  telefonoFlota?: string;
  telefonoPersonal?: string;
  posicion?: string;
  stats: {
    totalInterior: number;
    metroMes: number;
    totalSede: number;
    diasNorte: number;
    diasSur: number;
    diasEste: number;
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


