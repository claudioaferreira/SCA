import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Declaramos un evento que el componente padre (Layout) podrá escuchar
  @Output() sidebarToggle = new EventEmitter<void>();

  // Método que se llama al hacer clic en el botón
  onToggleSidebar(): void {
    this.sidebarToggle.emit(); // Emitimos el evento
  }
}
