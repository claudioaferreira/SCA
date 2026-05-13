import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../app/core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="theme-toggle"
      (click)="theme.toggle()"
      [title]="theme.esDark() ? 'Modo claro' : 'Modo oscuro'"
      aria-label="Cambiar tema">
      <i class="bi" [class.bi-sun-fill]="theme.esDark()" [class.bi-moon-stars-fill]="!theme.esDark()"></i>
    </button>
  `,
  styles: [`
    .theme-toggle {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border-default);
      background: var(--bg-card);
      color: var(--brand-darker);
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        background: var(--brand-soft);
        border-color: var(--brand);
        color: var(--brand-dark);
        i { transform: rotate(15deg); }
      }
      &:active { transform: scale(0.95); }
      i { font-size: 1rem; transition: transform var(--transition); }
    }
  `]
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}