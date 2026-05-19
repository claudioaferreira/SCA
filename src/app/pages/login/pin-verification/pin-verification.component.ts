import { Component, inject, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/user/auth.service';

@Component({
  selector: 'app-pin-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pin-verification.component.html',
  styleUrl: './pin-verification.component.scss',
})
export class PinVerificationComponent implements OnInit, OnDestroy {

  @ViewChildren('digitInputs') digitInputs!: QueryList<ElementRef>;

  // Array de 6 dígitos — uno por caja
  pinDigits = ['', '', '', '', '', ''];

  isLoading    = false;
  errorMessage = '';
  mensaje      = '';
  userId       = 0;
  currentYear  = new Date().getFullYear();

  // Contador regresivo — 10 minutos
  segundosRestantes = 600;
  private intervalo: any;

  private auth   = inject(AuthService);
  private router = inject(Router);

  // PIN completo como string — se usa para validar y enviar
  get pin(): string {
    return this.pinDigits.join('');
  }

  ngOnInit(): void {
    const userId = sessionStorage.getItem('sca_pin_userId');
    this.mensaje  = sessionStorage.getItem('sca_pin_msg') ?? '';

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = Number(userId);
    this.iniciarContador();

    // Foco en la primera caja al cargar
    setTimeout(() => {
      this.digitInputs?.first?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }

  private iniciarContador(): void {
    this.intervalo = setInterval(() => {
      if (this.segundosRestantes > 0) {
        this.segundosRestantes--;
      } else {
        clearInterval(this.intervalo);
      }
    }, 1000);
  }

  // ── Manejo de entrada en cada caja ────────────────────────────────────────
  onDigitInput(event: Event, index: number): void {
    const input  = event.target as HTMLInputElement;
    const value  = input.value.replace(/\D/g, ''); // solo números

    this.pinDigits[index] = value.slice(-1);
    input.value           = this.pinDigits[index];

    // Auto-avanzar al siguiente si se ingresó un dígito
    if (this.pinDigits[index] && index < 5) {
      const inputs = this.digitInputs.toArray();
      inputs[index + 1].nativeElement.focus();
    }

    // Auto-enviar si se completaron los 6 dígitos
    if (this.pin.length === 6) {
      this.verificar();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const inputs = this.digitInputs.toArray();
      if (this.pinDigits[index]) {
        // Borra el dígito actual
        this.pinDigits[index] = '';
      } else if (index > 0) {
        // Si ya está vacío, retrocede a la caja anterior
        this.pinDigits[index - 1] = '';
        inputs[index - 1].nativeElement.focus();
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.digitInputs.toArray()[index - 1].nativeElement.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    pasted.split('').forEach((char, i) => {
      if (i < 6) this.pinDigits[i] = char;
    });

    // Foco en la última caja llena o en la siguiente vacía
    const inputs    = this.digitInputs.toArray();
    const nextEmpty = this.pinDigits.findIndex(d => !d);
    const focusIdx  = nextEmpty !== -1 ? nextEmpty : 5;
    inputs[focusIdx].nativeElement.focus();

    if (this.pin.length === 6) {
      this.verificar();
    }
  }

  // ── Verificar PIN ─────────────────────────────────────────────────────────
  verificar(): void {
    if (this.pin.length !== 6 || this.isLoading) return;

    this.isLoading    = true;
    this.errorMessage = '';

    this.auth.verificarPin(this.userId, this.pin).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        sessionStorage.setItem('sca_token_cambio', res.tokenCambio);
        sessionStorage.removeItem('sca_pin_userId');
        sessionStorage.removeItem('sca_pin_msg');
        this.router.navigate(['/change-password']);
      },
      error: (err: any) => {
        this.isLoading    = false;
        this.errorMessage = err.error?.message ?? 'PIN incorrecto';
        // Limpiar cajas y regresar foco a la primera
        this.pinDigits = ['', '', '', '', '', ''];
        setTimeout(() => {
          this.digitInputs?.first?.nativeElement?.focus();
        }, 50);
      },
    });
  }

  volverAlLogin(): void {
    sessionStorage.removeItem('sca_pin_userId');
    sessionStorage.removeItem('sca_pin_msg');
    this.router.navigate(['/login']);
  }

  get tiempoFormateado(): string {
    const m = Math.floor(this.segundosRestantes / 60);
    const s = this.segundosRestantes % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  get pinExpirado(): boolean {
    return this.segundosRestantes === 0;
  }
}