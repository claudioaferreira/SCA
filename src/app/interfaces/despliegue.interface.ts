// ── Agregar a asignacion.interface.ts ────────────────────────────────────────

export interface Despliegue {
  IdDespliegue:  number;
  Titulo:        string;
  FechaInicio:   string;
  FechaFin:      string;
  Estado:        string;
  FechaCreacion: string;
  TotalRutas:    number;
  TotalTecnicos: number;
}

export interface DetalleRuta {
  IdRuta:          number;
  NumeroRuta:      number;
  Nombre:          string;
  Comentario:      string | null;
  IdEmpleado:      number | null;
  Empleado:        string | null;
  CodigoEmpleado:  string | null;
  IdZonaOperativa: number | null;
  ZonaOperativa:   string | null;
  IdAsignacion:    number | null;
  CentrosJSON:     string | null;
}

export interface CentroDetalle {
  IdRutaCentro: number;
  IdCentro:     number;
  Centro:       string;
  Orden:        number;
  Estado?:      string | null; 
}

// Fila del formulario al crear un despliegue
export interface RutaForm {
  nombre:          string;
  modoZona:        'operativa' | 'geo';  // ← nuevo
  idZonaOperativa: number | null;
  idZonaGeo:       number | null;        // ← nuevo
  idEmpleado:      number | null;
  comentario:      string;
  centros:         { idCentro: number; orden: number }[];
}
