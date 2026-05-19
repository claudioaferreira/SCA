import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Router }            from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { ILoginResponseToken } from '../../../interfaces/user/loginResponseToken';
import { ILoginRequest, IUser } from '../../../interfaces/user/user';
import { AuthService } from '../../../services/user/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

// import { AuthService }    from '@core/services/auth.service'; // ← descomenta con tu servicio

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class LoginPageComponent implements OnInit {

  credentials : ILoginRequest = {
    username: '',
    password: '',
  }
  rememberMe   = false;
  showPassword = false;
  isLoading    = false;
  errorMessage = '';
  currentYear  = new Date().getFullYear();

  user: IUser[] = [];

  private _userService = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor(

  ) {}

  ngOnInit(): void {
    // Autorellenar usuario si fue guardado antes
    const saved = localStorage.getItem('sca_username');
    if (saved) {
      this.credentials.username = saved;
      this.rememberMe = true;
    }
  }

 onLogin(): void {
  if (!this.credentials.username || !this.credentials.password) return;

  this.isLoading    = true;
  this.errorMessage = '';

  this._userService.login(this.credentials).subscribe({
    next: (response: ILoginResponseToken) => {
      this.isLoading = false;

      if (this.rememberMe) {
        localStorage.setItem('sca_username', this.credentials.username);
      } else {
        localStorage.removeItem('sca_username');
      }

      if (response.mustChangePassword) {
        // Guardar userId temporalmente para la pantalla de PIN
        sessionStorage.setItem('sca_pin_userId', String(response.userId));
        sessionStorage.setItem('sca_pin_msg',    response.message ?? '');
        this.router.navigate(['/verify-pin']);
      } else {
        this.auth.guardarSesion({
          token:        response.token,
          refreshToken: response.refreshToken,
          user:         response.user,
        });
        this.router.navigate(['/home']);
      }
    },
    error: (err) => {
      this.isLoading    = false;
      this.errorMessage = err.error?.message ?? 'Error del servidor. Intenta más tarde.';
    },
  });
}

  private handleLoginSuccess(response: ILoginResponseToken): void {
    // Guardar token (ajusta a tu estrategia: localStorage, cookie httpOnly, etc.)
    // Guardar tokens
        this.auth.guardarSesion({
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user
      });
    // Guardar usuario si "Recordarme" está activo
    if (this.rememberMe) {
      localStorage.setItem('sca_username', this.credentials.username);
    } else {
      localStorage.removeItem('sca_username');
    }

    // ── Punto clave: ¿debe cambiar contraseña? ─────────────
    if (response.mustChangePassword) {
      this.router.navigate(['/change-password']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}