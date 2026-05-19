import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { AsignacionesSemanalComponent } from './pages/asignaciones-semanal/asignaciones-semanal.component';
import { DisponibilidadComponent } from './pages/disponibilidad/disponibilidad.component';
import { EmpleadosComponent } from './pages/mantenimientos/empleados/empleados.component';
import { MantenimientosComponent } from './pages/mantenimientos/mantenimientos/mantenimientos.component';
import { SolicitudesComponent } from './pages/gestion-humana/solicitudes/solicitudes.component';
import { NuevaSolicitudComponent } from './pages/gestion-humana/nueva-solicitud/nueva-solicitud.component';
import { SaldosVacacionesComponent } from './pages/gestion-humana/saldos-vacaciones/saldos-vacaciones.component';
import { LoginPageComponent } from './pages/login/login-page/login-page.component';
import { ChangePasswordComponent } from './pages/login/change-password/change-password.component';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/roluser.guard';
import { UsuariosComponent } from './pages/mantenimientos/usuarios/usuarios.component';
import { PinVerificationComponent } from './pages/login/pin-verification/pin-verification.component';
import { DesplieguesComponent } from './pages/despliegues/despliegues.component';

export const routes: Routes = [

  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Iniciar sesión — SCA',
  },
       {
  path: 'verify-pin',
  component: PinVerificationComponent,
  // Sin authGuard — es parte del flujo de login
},

  {
    path: 'change-password',
    component: ChangePasswordComponent
  },

  {
    path: '',
    component: LayoutComponent,

    children: [

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },

      {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard],
      },

      // SOLO ADMIN
      {
        path: 'asignaciones',
        component: AsignacionesSemanalComponent,
        title: 'Asignaciones Semanales',
        canActivate: [
          authGuard,
          roleGuard([1, 2])
        ],
      },

      // ADMIN Y SUPERVISOR
      {
        path: 'disponibilidad',
        component: DisponibilidadComponent,
        title: 'Disponibilidad',
        canActivate: [
          authGuard,
          roleGuard([1, 2])
        ],
      },
      {
        path: 'despliegues',
        component: DesplieguesComponent,
        canActivate: [authGuard, roleGuard([1, 2])],
        title: 'Despliegues',
      },

      // SOLO ADMIN
      {
        path: 'mantenimientos',
        component: MantenimientosComponent,
        title: 'Mantenimientos',
        canActivate: [
          authGuard,
          roleGuard([1])
        ],
      },

      // SOLO ADMIN
      {
        path: 'mantenimientos/empleados',
        component: EmpleadosComponent,
        title: 'Empleados',
        canActivate: [
          authGuard,
          roleGuard([1])
        ],
      },

      // ADMIN Y VACACIONES
      {
        path: 'gestion-humana/solicitudes',
        component: SolicitudesComponent,
        title: 'Solicitudes — Gestión Humana',
        canActivate: [
          authGuard,
          roleGuard([1, 4])
        ],
      },

      // ADMIN Y VACACIONES
      {
        path: 'gestion-humana/solicitudes/nueva',
        component: NuevaSolicitudComponent,
        title: 'Nueva solicitud — Gestión Humana',
        canActivate: [
          authGuard,
          roleGuard([1, 4])
        ],
      },

      {
        path: 'mantenimientos/usuarios',
        component: UsuariosComponent,
        canActivate: [authGuard, roleGuard([1])],
        title: 'Registrar Usuario',
      },

 

      // ADMIN Y VACACIONES
      {
        path: 'gestion-humana/saldos-vacaciones',
        component: SaldosVacacionesComponent,
        title: 'Saldos de Vacaciones — Gestión Humana',
        canActivate: [
          authGuard,
          roleGuard([1, 4])
        ],
      },

    ],
  },
];