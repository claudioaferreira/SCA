import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

// Las tarjetas que aparecen en la pantalla de Mantenimientos
interface CardMenu {
  icono:       string;  // icono de Bootstrap Icons
  titulo:      string;
  descripcion: string;
  ruta:        string;  // a dónde navega al hacer clic
  color:       string;  // color del fondo del icono
}

@Component({
  selector:    'app-mantenimientos',
  standalone:  true,
  imports:     [RouterOutlet, RouterLink],
  templateUrl: './mantenimientos.component.html',
  styleUrls:   ['./mantenimientos.component.scss'],
})
export class MantenimientosComponent {

  // Lista de módulos disponibles en Mantenimientos
  modulos: CardMenu[] = [
    {
      icono:       'bi-people-fill',
      titulo:      'Empleados',
      descripcion: 'Gestionar técnicos y personal del sistema',
      ruta:        '/mantenimientos/empleados',
      color:       '#eff6ff',
    },
    {
      icono:       'bi-building',
      titulo:      'Departamentos',
      descripcion: 'Administrar las unidades organizativas',
      ruta:        '/mantenimientos/departamentos',
      color:       '#f0fdf4',
    },
    {
      icono:       'bi-shield-lock-fill',
      titulo:      'Roles',
      descripcion: 'Controlar permisos y niveles de acceso',
      ruta:        '/mantenimientos/roles',
      color:       '#fdf2f8',
    },
  ];
}