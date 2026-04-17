import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { PrintHandlerService } from '../../shared/print-handler.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  // private PrintHandlerService = inject(PrintHandlerService)

  // imprimirPlantillaVacia(){

  //   this.PrintHandlerService.imprimirPlantillaVacia();
  // }
}
