import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LevantamientoComponent } from './pages/levantamiento/levantamiento.component';
import { AsignacionesSemanalComponent } from './pages/asignaciones-semanal/asignaciones-semanal.component';
import { DisponibilidadComponent } from './pages/disponibilidad/disponibilidad.component';
import { EmpleadosComponent } from './pages/mantenimientos/empleados/empleados.component';
import { MantenimientosComponent } from './pages/mantenimientos/mantenimientos/mantenimientos.component';

export const routes: Routes = [
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
    },
    {
      path: 'asignaciones',
      component: AsignacionesSemanalComponent,
      title: 'Asignaciones Semanales',
    },
    {
      path: 'disponibilidad',
      component: DisponibilidadComponent,
      title: 'Disponibilidad',
    },
    {
      path: 'mantenimientos',
      component: MantenimientosComponent,
      title: 'Mantenimientos',
    },
    {
      path: 'mantenimientos/empleados',
      component: EmpleadosComponent,
      title: 'Empleados',
    },
  ],
}
];
