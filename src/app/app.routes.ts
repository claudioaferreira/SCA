import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LevantamientoComponent } from './pages/levantamiento/levantamiento.component';
import { AsignacionesSemanalComponent } from './pages/asignaciones-semanal/asignaciones-semanal.component';
import { DisponibilidadComponent } from './pages/disponibilidad/disponibilidad.component';

export const routes: Routes = [

    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'home',
                component: HomeComponent
            },
            {
                path: 'asignaciones',
                component: AsignacionesSemanalComponent,
                title: 'Asignaciones Semanales'
            },
             {
                path: 'disponibilidad',
                component: DisponibilidadComponent,
                title: 'Disponibilidad'
            },
        ]
    }
];
