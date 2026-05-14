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
  BloqueaEmpleado: boolean;
}

export interface Asignacion {
  idAsignacion?: number;
  idEmpleado: number;
  idTipo: number;
  fecha: string;
}

export interface AsignacionCelda {
  uid:          string;
  idAsignacion: number | null;
  tipoId:       number;
  cantidad:     string;   // Sede (1): tareas
  dias:         string;   // Metro (2) e Interior (3): días de viaje
  IdZonaGeo:    number;   // Interior (3): zona geográfica
  idEstado:     number;
  modificado:   boolean;
  guardadoOk:   boolean;
  esNueva:      boolean;
   // ── detalle del viaje ───────────────────────────────────────────────────
    idDetalle:    number | null;
    fechaInicio:  string;
    fechaFin:     string;
    nroTicket:    string;
    titulo:       string;
    chofer:       string;
    placa:        string;

    // ── centros visitados (reemplaza idCentroCedulacion único) ──────────────
    centros:      RutaCentro[];   // [] para Sede y Metro sin centro
}

export interface ZonaGeo{
  IdZonaGeo: number;
  Descripcion: string;
}

export interface ResumenHome {
  IdTipo:             number;
  TotalCantidad:      number;
  TotalDias:          number;
  TotalAsignaciones:  number;
}

// Cada centro individual en la lista de la ruta
export interface RutaCentro {
    idRutaCentro?:       number;   // null si es nuevo (aún no guardado)
    idCentroCedulacion:  number;
    orden:               number;
    // campos derivados para mostrar en pantalla
    centro?:             string;
    municipio?:          string;
    provincia?:          string;
    zonaGeo?:            string;
}

// Interface para el selector de centros
export interface CentroCedulacion {
    IdCentroCedulacion: number;
    Centro:             string;
    ZonaOperativa:      string;
    IdMunicipio:        number;
    Municipio:          string;
    IdProvincia:        number;
    Provincia:          string;
    IdZonaGeo:          number;
    ZonaGeo:            string;
}