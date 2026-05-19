import { Component, inject, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Router }            from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/user/auth.service';

interface PasswordRules {
  length:    boolean;
  uppercase: boolean;
  number:    boolean;
  special:   boolean;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {

  form = { newPassword: '', confirm: '' };

  showNew     = false;
  showConfirm = false;
  isLoading   = false;
  errorMessage = '';
  currentYear  = new Date().getFullYear();

  // Estado de reglas (para los checks en vivo)
  rules: PasswordRules = {
    length:    false,
    uppercase: false,
    number:    false,
    special:   false,
  };

  // Fortaleza: 'weak' | 'fair' | 'good' | 'strong'
  strengthLevel = 'weak';
  strengthLabel = 'Débil';
  strengthPct   = 0;

  private _userService = inject(UserService);
  private _auth = inject(AuthService);
  private router = inject(Router);


  ngOnInit(): void {

  }

  // Valida las reglas en tiempo real mientras el usuario escribe
  validatePassword(value: string): void {
    this.rules = {
      length:    value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      number:    /[0-9]/.test(value),
      special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
    };

    const score = Object.values(this.rules).filter(Boolean).length;

    const levels: Record<number, { level: string; label: string; pct: number }> = {
      0: { level: 'weak',   label: 'Débil',    pct: 10  },
      1: { level: 'weak',   label: 'Débil',    pct: 25  },
      2: { level: 'fair',   label: 'Regular',  pct: 50  },
      3: { level: 'good',   label: 'Buena',    pct: 75  },
      4: { level: 'strong', label: 'Excelente',pct: 100 },
    };

    const { level, label, pct } = levels[score];
    this.strengthLevel = level;
    this.strengthLabel = label;
    this.strengthPct   = pct;
  }

  // Verifica que el formulario está listo para enviar
  isFormValid(): boolean {
    return (
      this.form.newPassword.length >= 8 &&
      this.form.newPassword === this.form.confirm &&
      Object.values(this.rules).every(Boolean)
    );
  }

  onSubmit(): void {
  if (!this.isFormValid()) return;

  this.isLoading    = true;
  this.errorMessage = '';

  this._userService.changePassword(this.form.newPassword).subscribe({
    next: () => {
      this.isLoading = false;

      // Limpiar token temporal
      sessionStorage.removeItem('sca_token_cambio');

      // Primero cerrar sesión y navegar
      this._auth.logout();

      // Luego mostrar el toast (no bloquea la navegación)
      Swal.fire({
        icon:              'success',
        title:             'Contraseña actualizada',
        text:              'Inicia sesión con tu nueva contraseña.',
        toast:             true,
        position:          'top-end',
        timer:             3500,
        showConfirmButton: false,
        timerProgressBar:  true,
      });
    },
    error: (err) => {
      this.isLoading    = false;
      this.errorMessage = err?.error?.message ?? 'No se pudo cambiar la contraseña.';
    },
  });
}
}