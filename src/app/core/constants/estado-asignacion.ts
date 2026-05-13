/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ESTADO_ASIGNACION
 *  Estado operativo de una asignación (columna idEstado en tabla Asignaciones).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  OCUPADO     → el técnico está bloqueado, no puede tomar otra asignación
 *  EN_CURSO    → reservado por si lo usas (puedes ignorarlo si no aplica)
 *  DISPONIBLE  → liberado, puede tomar otra
 *
 *  Cuándo NO se aplica el bloqueo:
 *  - Si la asignación es de tipo SEDE → no bloquea aunque idEstado sea OCUPADO.
 *
 *  Cómo se usa:
 *      import { ESTADO_ASIGNACION } from 'src/app/core/constants/estado-asignacion';
 *
 *      if (item.idEstado !== ESTADO_ASIGNACION.DISPONIBLE) { ... }
 *      this.empleadosService.actualizarEstado(id, ESTADO_ASIGNACION.OCUPADO);
 */

export const ESTADO_ASIGNACION = {
  OCUPADO:    1,
  EN_CURSO:   2,
  DISPONIBLE: 3,
} as const;

/**
 * Devuelve el nombre legible del estado.
 */
export function nombreEstado(idEstado: number): string {
  switch (idEstado) {
    case ESTADO_ASIGNACION.OCUPADO:    return 'Ocupado';
    case ESTADO_ASIGNACION.EN_CURSO:   return 'En curso';
    case ESTADO_ASIGNACION.DISPONIBLE: return 'Disponible';
    default:                           return 'Desconocido';
  }
}
