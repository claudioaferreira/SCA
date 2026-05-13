import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { PrintHandlerService } from '../../shared/print-handler.service';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  // private PrintHandlerService = inject(PrintHandlerService)

  // imprimirPlantillaVacia(){

  //   this.PrintHandlerService.imprimirPlantillaVacia();
  // }
}
