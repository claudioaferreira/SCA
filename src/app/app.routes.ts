import { Routes } from '@angular/router';
import { LayoutComponent }              from './layout/layout.component';
import { HomeComponent }                from './pages/home/home.component';
import { AsignacionesSemanalComponent } from './pages/asignaciones-semanal/asignaciones-semanal.component';
import { DisponibilidadComponent }      from './pages/disponibilidad/disponibilidad.component';
import { EmpleadosComponent }           from './pages/mantenimientos/empleados/empleados.component';
import { MantenimientosComponent }      from './pages/mantenimientos/mantenimientos/mantenimientos.component';
import { SolicitudesComponent }         from './pages/gestion-humana/solicitudes/solicitudes.component';
import { NuevaSolicitudComponent }      from './pages/gestion-humana/nueva-solicitud/nueva-solicitud.component';
import { SaldosVacacionesComponent }    from './pages/gestion-humana/saldos-vacaciones/saldos-vacaciones.component';
import { LoginPageComponent }           from './pages/login/login-page/login-page.component';
import { ChangePasswordComponent }      from './pages/login/change-password/change-password.component';
import { PinVerificationComponent }     from './pages/login/pin-verification/pin-verification.component';
import { DesplieguesComponent }         from './pages/despliegues/despliegues.component';
import { UsuariosComponent }            from './pages/mantenimientos/usuarios/usuarios.component';
import { PermisosComponent }            from './pages/mantenimientos/permisos/permisos.component';
import { authGuard }                    from './guards/auth.guard';
import { permisoGuard }                 from './guards/permiso.guard';

/**
 * app.routes.ts — sistema de permisos migrado completamente.
 *
 * REGLA: canActivate: [authGuard, permisoGuard('modulo.accion')]
 *
 * ¿Cómo agregar un módulo nuevo?
 *   1. Crea el componente
 *   2. Agrega la ruta aquí con canActivate: [authGuard, permisoGuard('nuevo.ver')]
 *   3. Agrega la línea en nav-config.ts
 *   4. Haz el INSERT en la BD para el permiso
 *   ──> NUNCA más tocas guards, sidebar ni backend para controlar acceso
 */
export const routes: Routes = [

  // ── Rutas públicas ────────────────────────────────────────────────────
  { path: 'login',           component: LoginPageComponent,    title: 'Iniciar sesión — SCA' },
  { path: 'verify-pin',      component: PinVerificationComponent },
  { path: 'change-password', component: ChangePasswordComponent },

  // ── Rutas protegidas (dentro del layout) ──────────────────────────────
  {
    path: '',
    component: LayoutComponent,
    children: [

      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // home: cualquier usuario autenticado puede verlo
      {
        path: 'home',
        component: HomeComponent,
        title: 'Inicio',
        canActivate: [authGuard, permisoGuard('home.ver')],
      },

      // ── Operaciones ───────────────────────────────────────────────────
      {
        path: 'asignaciones',
        component: AsignacionesSemanalComponent,
        title: 'Asignaciones Semanales',
        canActivate: [authGuard, permisoGuard('asignaciones.ver')],
      },
      {
        path: 'disponibilidad',
        component: DisponibilidadComponent,
        title: 'Disponibilidad',
        canActivate: [authGuard, permisoGuard('disponibilidad.ver')],
      },
      {
        path: 'despliegues',
        component: DesplieguesComponent,
        title: 'Despliegues',
        canActivate: [authGuard, permisoGuard('despliegues.ver')],
      },

      // ── Mantenimientos ────────────────────────────────────────────────
      {
        path: 'mantenimientos',
        component: MantenimientosComponent,
        title: 'Mantenimientos',
        canActivate: [authGuard, permisoGuard('mantenimientos.ver')],
      },
      {
        path: 'mantenimientos/empleados',
        component: EmpleadosComponent,
        title: 'Empleados',
        canActivate: [authGuard, permisoGuard('empleados.ver')],
      },
      {
        path: 'mantenimientos/usuarios',
        component: UsuariosComponent,
        title: 'Registrar Usuario',
        canActivate: [authGuard, permisoGuard('usuarios.ver')],
      },
      {
        path: 'mantenimientos/permisos',
        component: PermisosComponent,
        title: 'Permisos de Roles',
        canActivate: [authGuard, permisoGuard('roles.gestionar')],
      },

      // ── Gestión Humana ────────────────────────────────────────────────
      {
        path: 'gestion-humana/solicitudes',
        component: SolicitudesComponent,
        title: 'Solicitudes — Gestión Humana',
        canActivate: [authGuard, permisoGuard('solicitudes.ver')],
      },
      {
        path: 'gestion-humana/solicitudes/nueva',
        component: NuevaSolicitudComponent,
        title: 'Nueva solicitud — Gestión Humana',
        canActivate: [authGuard, permisoGuard('solicitudes.crear')],
      },
      {
        path: 'gestion-humana/saldos-vacaciones',
        component: SaldosVacacionesComponent,
        title: 'Saldos de Vacaciones — Gestión Humana',
        canActivate: [authGuard, permisoGuard('vacaciones.ver')],
      },

      // ── Agrega módulos nuevos aquí ────────────────────────────────────
      // { path: 'reportes', component: ReportesComponent, title: 'Reportes',
      //   canActivate: [authGuard, permisoGuard('reportes.ver')] },

    ],
  },
];