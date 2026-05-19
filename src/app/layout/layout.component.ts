import { Component, input } from '@angular/core';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component'
import { BreadcrumbComponent } from "../components/breadcrumb/breadcrumb.component";
import {
  trigger, transition, style, animate, query
} from '@angular/animations';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterOutlet, SidebarComponent, BreadcrumbComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
// animations: [
//   trigger('routeAnimation', [
//     transition('* <=> *', [
//       // Ambas páginas se superponen durante la transición
//       query(':enter, :leave', [
//         style({ position: 'absolute', width: '100%', top: 0, left: 0 })
//       ], { optional: true }),
//       // Solo fade en la entrada
//       query(':enter', [
//         style({ opacity: 0 }),
//         animate('250ms ease-out', style({ opacity: 1 }))
//       ], { optional: true }),
//     ])
//   ])
// ]
})


export class LayoutComponent {
  public isSidebarCollapsed: boolean;

  constructor() {
    // 2. Al crear el componente, revisa en la memoria del navegador si el usuario
    //    ya tenía una preferencia guardada para mantenerla.
    this.isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  }

    // 3. Esta es la función que se encarga de cambiar el estado y guardarlo.
  //    Es llamada por el evento (sidebarToggle) en el HTML.
  toggleSidebar(): void {
    // Invierte el valor actual (si es 'true' lo hace 'false' y viceversa).
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    
    // Guarda la nueva preferencia en la memoria del navegador para la próxima visita.
    localStorage.setItem('sidebarCollapsed', this.isSidebarCollapsed.toString());
  }
}
