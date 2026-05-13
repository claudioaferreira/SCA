import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  private _userService = inject(UserService);
  private router = inject(Router);
  // Declaramos un evento que el componente padre (Layout) podrá escuchar
  @Output() sidebarToggle = new EventEmitter<void>();

  // Método que se llama al hacer clic en el botón
  onToggleSidebar(): void {
    this.sidebarToggle.emit(); // Emitimos el evento
  }

  logout(event: Event): void {

  event.preventDefault();

  this._userService.logout();

  this.router.navigate(['/login']);
}
}
