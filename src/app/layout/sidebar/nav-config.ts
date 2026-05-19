/**
 * nav-config.ts
 *
 * Tabla centralizada de navegación.
 * Cada entrada mapea UN permiso → una ruta del sidebar.
 *
 * ¿Cuándo tocas este archivo?
 *   SOLO cuando creas un módulo NUEVO. Agregas la línea aquí y listo.
 *   Para cambiar quién puede ver qué, solo mueves checkboxes en la pantalla
 *   de Permisos — sin tocar código.
 *
 * Estructura de grupos:
 *   group    → label de la sección (ej: "Operaciones")
 *   items    → lista de ítems del grupo
 *     permiso  → clave del permiso requerido para ver este ítem
 *     label    → texto visible en el sidebar
 *     ruta     → path de Angular Router
 *     icono    → clase Bootstrap Icon
 *     child    → (opcional) true si es sub-ítem con indentación
 */

export interface NavItem {
  permiso: string | null;  // null = siempre visible para cualquier usuario autenticado
  label:   string;
  ruta:    string;
  icono:   string;
  child?:  boolean;
}

export interface NavGroup {
  groupLabel: string;
  items:      NavItem[];
}

export const NAV_CONFIG: NavGroup[] = [
  {
    groupLabel: 'Operaciones',
    items: [
      {
        permiso: null,       // visible para todo usuario autenticado
        label:   'Inicio',
        ruta:    '/home',
        icono:   'bi-house-door',
      },
      {
        permiso: 'asignaciones.ver',
        label:   'Asignaciones',
        ruta:    '/asignaciones',
        icono:   'bi-calendar2-week',
      },
      {
        permiso: 'disponibilidad.ver',
        label:   'Disponibilidad',
        ruta:    '/disponibilidad',
        icono:   'bi-person-check',
      },
      {
        permiso: 'despliegues.ver',
        label:   'Despliegues',
        ruta:    '/despliegues',
        icono:   'bi-map',
      },
    ],
  },
  {
    groupLabel: 'Mantenimientos',
    items: [
      {
        permiso: 'mantenimientos.ver',
        label:   'General',
        ruta:    '/mantenimientos',
        icono:   'bi-tools',
      },
      {
        permiso: 'empleados.ver',
        label:   'Empleados',
        ruta:    '/mantenimientos/empleados',
        icono:   'bi-people',
        child:   true,
      },
      {
        permiso: 'usuarios.ver',
        label:   'Usuarios',
        ruta:    '/mantenimientos/usuarios',
        icono:   'bi-person-gear',
        child:   true,
      },
      {
        permiso: 'roles.gestionar',
        label:   'Permisos',
        ruta:    '/mantenimientos/permisos',
        icono:   'bi-shield-check',
        child:   true,
      },
    ],
  },
  {
    groupLabel: 'Gestión Humana',
    items: [
      {
        permiso: 'solicitudes.ver',
        label:   'Solicitudes',
        ruta:    '/gestion-humana/solicitudes',
        icono:   'bi-inbox',
        child:   true,
      },
      {
        permiso: 'solicitudes.crear',
        label:   'Nueva Solicitud',
        ruta:    '/gestion-humana/solicitudes/nueva',
        icono:   'bi-plus-circle',
        child:   true,
      },
      {
        permiso: 'vacaciones.ver',
        label:   'Saldos de Vacaciones',
        ruta:    '/gestion-humana/saldos-vacaciones',
        icono:   'bi-calendar2-check',
        child:   true,
      },
    ],
  },

  // ── Cuando crees un módulo nuevo, agrega su grupo/ítem aquí ──────────
  // Ejemplo:
  // {
  //   groupLabel: 'Reportes',
  //   items: [
  //     { permiso: 'reportes.ver', label: 'Dashboard', ruta: '/reportes', icono: 'bi-bar-chart-line' },
  //   ],
  // },
];