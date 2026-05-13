import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Router }            from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { ILoginResponseToken } from '../../../interfaces/user/loginResponseToken';
import { ILoginRequest, IUser } from '../../../interfaces/user/user';

// import { AuthService }    from '@core/services/auth.service'; // ← descomenta con tu servicio

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
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

  constructor(
    private router: Router,
    // private authService: AuthService,
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

    this.isLoading  = true;
    this.errorMessage = '';

    // ── Integra aquí tu AuthService ────────────────────────
    
    this._userService.login(this.credentials).subscribe({
      next: (response:ILoginResponseToken) => {
        console.log('Login exitoso:', response);
        this.handleLoginSuccess(response);
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : 'Error del servidor. Intenta más tarde.';
      }
    });
    
    // ── Simulación temporal (eliminar al integrar) ─────────

    setTimeout(() => {
      this.isLoading = false;

      // // Simula respuesta del servidor con mustChangePassword
      // const mockResponse = {
      //   token: 'mock-token-abc123',
      //   mustChangePassword: this.credentials.password === 'temp1234',
      //   user: { id: 1, username: this.credentials.username },
      // };

      // this.handleLoginSuccess(mockResponse);
    }, 1200);
  }

  private handleLoginSuccess(response: ILoginResponseToken): void {
    // Guardar token (ajusta a tu estrategia: localStorage, cookie httpOnly, etc.)
    // Guardar tokens
    localStorage.setItem('sca_token', response.token);
    localStorage.setItem('sca_refresh_token', response.refreshToken);

    // Guardar usuario logueado
    localStorage.setItem('sca_user', JSON.stringify(response.user));

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