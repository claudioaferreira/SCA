import Swal from 'sweetalert2';
import { AsignacionCelda } from '../../interfaces/asignacion.interface';

const NOMBRE_TIPO:  Record<number, string> = {
    1: 'Sede',
    2: 'Metro',
    3: 'Interior',
    4: 'Exterior',
    5: 'Despliegue',
};

/**
 * Alerta: técnico ocupado en otra asignación de la semana.
 */

export function alertaTecnicoOcupado(diaSemana: Date, asignacion: AsignacionCelda): void {
    const nombreDia = diaSemana.toLocaleDateString('es-DO', {
        weekday: 'long',
        day: '2-digit',
        month: 'short'
    });

    const nombreTipo = NOMBRE_TIPO[asignacion.tipoId] ?? 'Desconocido';
    const detalle = construirDetalle(asignacion);

    Swal.fire({
    icon: 'warning',
    title: 'Técnico ocupado',
    html: `
      <div style="font-size:0.9rem; line-height:1.8;">
        <div>Este técnico tiene una asignación activa:</div>
        <div class="mt-2">
          <span style="background:#fef3c7; padding:2px 8px; border-radius:4px; font-weight:600;">
            📅 ${nombreDia}
          </span>
        </div>
        <div class="mt-1">
          <span style="background:#fee2e2; padding:2px 8px; border-radius:4px; font-weight:600;">
            🗂️ ${nombreTipo}${detalle}
          </span>
        </div>
        <div class="mt-2 text-muted" style="font-size:0.78rem;">
          Libéralo primero para poder agregar una nueva asignación.
        </div>
      </div>
    `,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#2563eb',
  });
}

/**
 * Alerta: todos los tipos del día ya están asignados.
 */

export function alertaTodosLosTiposAsignados(): void {
  Swal.fire({
    icon: 'info',
    title: 'Todos los tipos asignados',
    text: 'Este técnico ya tiene todos los tipos cubiertos para este día.',
    timer: 2000,
    showConfirmButton: false,
  });
}

/**
 * Confirmación de eliminar. Devuelve true si el usuario aceptó.
 */
export function confirmarEliminarAsignacion(): Promise<boolean> {
  return Swal.fire({
    title: '¿Eliminar asignación?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }).then(result => result.isConfirmed);
}

/**
 * Alerta: error al guardar una asignación.
 */
export function alertaErrorGuardar(): void {
  Swal.fire({
    icon: 'error',
    title: 'Error al guardar',
    text: 'Revisa tu conexión e intenta de nuevo.',
    timer: 3000,
    showConfirmButton: false,
  });
}

/**
 * Alerta: tipo duplicado en el día.
 */
export function alertaTipoDuplicado(nombreTipo: string): void {
  Swal.fire({
    icon: 'warning',
    title: 'Tipo duplicado',
    text: `Ya existe una asignación de tipo "${nombreTipo}" guardada para este día.`,
    timer: 2500,
    showConfirmButton: false,
  });
}

// ── helper privado ──────────────────────────────────────────────────────────
function construirDetalle(asig: AsignacionCelda): string {
  if (asig.tipoId === 1 && asig.cantidad)  return ` · ${asig.cantidad} tareas`;
  if (asig.tipoId === 2 && asig.dias)      return ` · 🚇 ${asig.dias} rutas`;
  if ((asig.tipoId === 3 || asig.tipoId === 4) && asig.IdZonaGeo) {
    return ` · ${asig.dias}d — ${asig.IdZonaGeo}`;
  }
  return '';
}