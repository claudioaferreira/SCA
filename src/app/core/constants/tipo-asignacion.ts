/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TIPO_ASIGNACION
 *  Catálogo: tabla Cat_TipoAsignacion en SQL Server.
 *  Cada técnico puede tener una asignación de uno de estos tipos por día.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ¿Por qué existe este archivo?
 *  Antes el código tenía números sueltos (1, 2, 3, 4) regados por todos lados.
 *  Si mañana cambia un id en BD, había que buscarlo a mano. Ahora se cambia AQUÍ
 *  una sola vez y todo el frontend se actualiza solo.
 *
 *  ¿Cómo se usa?
 *      import { TIPO_ASIGNACION, TIPOS_CON_LIMITE } from 'src/app/core/constants/tipo-asignacion';
 *
 *      if (item.tipoId === TIPO_ASIGNACION.SEDE) { ... }
 *      if (TIPOS_CON_LIMITE.includes(item.tipoId)) { ... }
 */

export const TIPO_ASIGNACION = {
  SEDE:     1,
  METRO:    2,
  INTERIOR: 3,
  EXTERIOR: 4,
} as const;

/**
 * Tipos que bloquean al técnico toda la semana.
 * Sede Central NO bloquea — el técnico puede tener Sede + otro tipo.
 */
export const TIPOS_CON_LIMITE: number[] = [
  TIPO_ASIGNACION.METRO,
  TIPO_ASIGNACION.INTERIOR,
  TIPO_ASIGNACION.EXTERIOR,
];

/**
 * Tipos que requieren un detalle de ruta (fechas, ticket, chofer, placa, centros).
 * Ojo: Exterior técnicamente también es ruta, pero hoy el form de detalle
 * está activo sólo para Metro e Interior.
 */
export const TIPOS_CON_RUTA: number[] = [
  TIPO_ASIGNACION.METRO,
  TIPO_ASIGNACION.INTERIOR,
];

/**
 * Devuelve el nombre legible del tipo.
 * Útil cuando aún no has cargado el catálogo de la API.
 */
export function nombreTipo(idTipo: number): string {
  switch (idTipo) {
    case TIPO_ASIGNACION.SEDE:     return 'Sede Central';
    case TIPO_ASIGNACION.METRO:    return 'Metro';
    case TIPO_ASIGNACION.INTERIOR: return 'Interior';
    case TIPO_ASIGNACION.EXTERIOR: return 'Exterior';
    default:                       return 'Desconocido';
  }
}
