/**
 * Forma de los datos que llegan del endpoint
 * GET /api/gestion-humana/solicitudes
 *
 * Muchos campos son `| null` porque el backend hace LEFT JOIN
 * y devuelve NULL para los campos que no aplican al tipo.
 *
 * Ejemplo: si la solicitud es Vacaciones, los campos de Incidencia
 * llegan en NULL, y viceversa.
 */
export interface SolicitudListado {
  // ── Datos comunes ──
  IdSolicitud:        number;
  IdEmpleado:         number;
  Empleado:           string;
  CodigoEmpleado:     string;
  IdTipoSolicitud:    number;
  TipoSolicitud:      string;     // 'Permiso', 'Licencia', 'Incidencia', 'Vacaciones'
  IdEstadoSolicitud:  number;
  EstadoSolicitud:    string;     // 'Pendiente', 'Aprobada', etc.
  FechaSolicitud:     string;     // 'YYYY-MM-DD'
  Comentarios:        string | null;

  // ── Datos de Ausencia (Permiso día completo, Licencia, Vacaciones) ──
  IdSubtipoPermiso:        number | null;
  SubtipoPermiso:          string | null;
  IdSubtipoLicencia:       number | null;
  SubtipoLicencia:         string | null;
  CantidadDias:            number | null;
  FechaInicio:             string | null;
  FechaReintegro:          string | null;
  AñoCorrespondiente:      number | null;
  EspecificarOtroAusencia: string | null;
  DocumentoEntregado:      boolean | null;

  // ── Datos de Permiso por Hora ──
  CantidadHoras:       number | null;
  HorarioInicio:       string | null;
  HorarioFin:          string | null;
  FechaPermiso:        string | null;
  SubtipoPermisoHora:  string | null;

  // ── Datos de Incidencia ──
  IdSubtipoIncidencia: number | null;
  SubtipoIncidencia:   string | null;
  HoraEvento:          string | null;
  FechaEvento:         string | null;
  Justificado:         boolean | null;
  Motivo:              string | null;
}