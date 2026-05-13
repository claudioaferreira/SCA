import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sca-theme';

  /** Estado reactivo del tema actual */
  readonly theme = signal<Theme>(this.cargarTemaInicial());

  constructor() {
    // Cada vez que cambia el signal, aplica el tema al DOM
    effect(() => {
      this.aplicarTema(this.theme());
    });
  }

  /** Alterna entre claro y oscuro */
  toggle(): void {
    const nuevo: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(nuevo);
    localStorage.setItem(this.STORAGE_KEY, nuevo);
  }

  /** Devuelve true si actualmente está en modo oscuro */
  esDark(): boolean {
    return this.theme() === 'dark';
  }

  // ── Privados ──────────────────────────────────────────────────

  private aplicarTema(t: Theme): void {
    document.documentElement.setAttribute('data-theme', t);
  }

  private cargarTemaInicial(): Theme {
    // 1) Si el usuario eligió antes, respetar su preferencia
    const guardado = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (guardado === 'light' || guardado === 'dark') return guardado;

    // 2) Si nunca eligió, usar la preferencia del sistema operativo
    const prefiereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefiereDark ? 'dark' : 'light';
  }
}