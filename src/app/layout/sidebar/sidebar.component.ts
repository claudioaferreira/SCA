import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/user/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLinkActive, RouterLink, NgIf],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  private _userService = inject(UserService);
  public auth = inject(AuthService);


  private router = inject(Router);
  // Declaramos un evento que el componente padre (Layout) podrá escuchar
  @Output() sidebarToggle = new EventEmitter<void>();

  // Expón lo que necesite el template
  username = this.auth.username;     // signal
  nombreRol = this.auth.nombreRol;   // signal

  // Método que se llama al hacer clic en el botón
  onToggleSidebar(): void {
    this.sidebarToggle.emit(); // Emitimos el evento
  }

  logout(event: Event): void {

  event.preventDefault();

  this.auth.logout();

  this.router.navigate(['/login']);
}
}
