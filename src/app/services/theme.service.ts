import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sca-theme';
  readonly theme = signal<Theme>(this.cargarTemaInicial());

  constructor() {
    effect(() => this.aplicar(this.theme()));
  }

  toggle(): void {
    const nuevo: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(nuevo);
    localStorage.setItem(this.STORAGE_KEY, nuevo);
  }

  esDark(): boolean { return this.theme() === 'dark'; }

  private aplicar(t: Theme): void {
    document.documentElement.setAttribute('data-theme', t);
  }

  private cargarTemaInicial(): Theme {
    const guardado = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (guardado === 'light' || guardado === 'dark') return guardado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}