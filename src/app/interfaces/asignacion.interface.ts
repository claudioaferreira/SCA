export interface Empleado {
  id: number;
  nombre: string;
  codigo: string;
  cedula?: string;
  telefonoFlota?: string;
  telefonoPersonal?: string;
  IdDepartamento: number; // ← ID numérico para el form
  departamento: string; // ← texto para mostrar en tabla
  IdCargo: number; // ← ID numérico para el form
  cargo: string; // ← antes "posicion"
  ubicacion: string;
  localidad: string;
  estado: boolean;
  equipos?: EquipoAsignado[];
  stats: {
    metroSemana: number;
    totalInteriorSemana: number;
    totalSedeSemana: number;
    metroMes: number;
    totalSede: number;
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
  BloqueaEmpleado: boolean;
   Alias:           string;
   EsGestionadoExterno:  boolean;
}

export interface Asignacion {
  idAsignacion?: number;
  idEmpleado: number;
  idTipo: number;
  fecha: string;
}

export interface AsignacionCelda {
  uid: string;
  idAsignacion: number | null;
  tipoId: number;
  cantidad: string; // Sede (1): tareas
  dias: string; // Metro (2) e Interior (3): días de viaje
  IdZonaGeo: number; // Interior (3): zona geográfica
  idEstado: number;
  modificado: boolean;
  guardadoOk: boolean;
  esNueva: boolean;
 tipoAlias?:            string;   // Alias del tipo (ej: 'despliegue')
  esGestionadoExterno?:  boolean;  // viene de Cat_TipoAsignacion
  badgeTexto?:           string | null; // texto del subtítulo (ej: nombre del despliegue)
  // ── detalle del viaje ───────────────────────────────────────────────────
  idDetalle: number | null;
  fechaInicio: string;
  fechaFin: string;
  nroTicket: string;
  titulo: string;
  chofer: string;
  placa: string;

  // ── centros visitados (reemplaza idCentroCedulacion único) ──────────────
  centros: RutaCentro[]; // [] para Sede y Metro sin centro
}

export interface ZonaGeo {
  IdZonaGeo: number;
  Descripcion: string;
}

export interface ResumenHome {
  IdTipo: number;
  TotalCantidad: number;
  TotalDias: number;
  TotalAsignaciones: number;
}

// Cada centro individual en la lista de la ruta
export interface RutaCentro {
  idRutaCentro?: number; // null si es nuevo (aún no guardado)
  idCentroCedulacion: number;
  orden: number;
  // campos derivados para mostrar en pantalla
  centro?: string;
  municipio?: string;
  provincia?: string;
  zonaGeo?: string;
}

// Interface para el selector de centros
export interface CentroCedulacion {
  IdCentroCedulacion: number;
  Centro: string;
  ZonaOperativa: string;
  IdZonasOperativas:  number;
  IdMunicipio: number;
  Municipio: string;
  IdProvincia: number;
  Provincia: string;
  IdZonaGeo: number;
  ZonaGeo: string;
}

export interface DisponibilidadEmpleado {
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

export interface EstadoSolicitud {
  IdEstadoSolicitud: number;
  Descripcion:       string;
  Alias:             string;   // ← nuevo
}

export interface TipoSolicitud {
  IdTipoSolicitud: number;
  Descripcion: string;
  BloqueaAsignacion: boolean;
   Alias:            string;
}
export interface SubtipoPermiso {
  IdSubtipoPermiso: number;
  Descripcion: string;
  EsOtros:          boolean; 
}
export interface SubtipoLicencia {
  IdSubtipoLicencia: number;
  Descripcion: string;
}
export interface SubtipoIncidencia {
  IdSubtipoIncidencia: number;
  Descripcion: string;
}
export interface AnioDisponible {
  Anio: number;
  DiasDisponibles: number;
  EstadoVencimiento: string;
}
export interface SaldoVacaciones {
  nombre: string;
  DiasDisponibles: number;
  DiasAnuales: number;
}

export interface UsuarioListado {
  id:                 number;
  username:           string;
  email:              string;
  isActive:           boolean;
  mustChangePassword: boolean;
  createdAt:          string;
  IdRol:              number;
  rol:                string;
  IdEmpleado:         number;
  empleado:           string;
  codigo:             string;
}

export interface Rol {
  IdRol:      number;
  descripcion: string;
}

export interface EmpleadoSinUsuario {
  id:     number;
  nombre: string;
  codigo: string;
  correo: string | null;
}
