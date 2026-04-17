import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empleado, TipoAsignacion } from '../../interfaces/asignacion.interface';

@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.css']
})
export class AsignacionesSemanalComponent implements OnInit {
  
  // Catálogo de tipos
  tipos: TipoAsignacion[] = [
    { idTipo: 1, nombre: 'Sede Central' },
    { idTipo: 2, nombre: 'Metro' },
    { idTipo: 3, nombre: 'Interior' },
    { idTipo: 4, nombre: 'Exterior' }
  ];

  // Lista de técnicos con sus "Stats" (Lo que antes tenías en otras hojas)
  empleados = [
    { 
      idEmpleado: 1, 
      nombre: 'Angel Martinez Doñe', 
      codigo: '19990425', 
      localidad: 'Taller Informatica',
      stats: { metroMes: 2, totalInterior: 45 } // Datos acumulados
    },
    { 
      idEmpleado: 2, 
      nombre: 'Jarleny Sanchez', 
      codigo: '20140911', 
      localidad: 'Taller Informatica',
      stats: { metroMes: 5, totalInterior: 12 } 
    }
  ];

  diasSemana: Date[] = [];
  
  // Objeto para guardar lo que el usuario escribe (Simula la persistencia)
  // Estructura: { "empleadoId-fecha": { tipoId: 1, cantidad: 3 } }
  asignacionesTemp: any = {};

  ngOnInit() {
    this.calcularSemanaActual();
  }

  calcularSemanaActual() {
    const hoy = new Date();
    // Ajustar al lunes de la semana actual
    const lunes = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1)));
    
    this.diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }

  // Esta función eficientiza el trabajo: Se dispara al cambiar cualquier celda
  onGuardarCambio(idEmpleado: number, fecha: Date, tipoId: string, cantidad: string) {
    const fechaKey = fecha.toISOString().split('T')[0];
    const key = `${idEmpleado}-${fechaKey}`;

    this.asignacionesTemp[key] = {
      tipoId: parseInt(tipoId),
      cantidad: parseInt(cantidad) || 0
    };

    console.log('Cambio registrado localmente:', this.asignacionesTemp[key]);
    
    // LÓGICA DE APOYO: Si es Interior, podríamos lanzar una alerta o sugerencia
    if (tipoId === '3') {
      this.actualizarContadorVisual(idEmpleado, 'interior');
    }
  }

  actualizarContadorVisual(idEmpleado: number, tipo: string) {
    const emp = this.empleados.find(e => e.idEmpleado === idEmpleado);
    if (emp && tipo === 'interior') {
      // Esto es solo visual para que el usuario vea el cambio antes de guardar en DB
      emp.stats.totalInterior++; 
    }
  }

  // Para darle color a las celdas según el tipo (Mejora visual)
  getClaseFondo(idEmpleado: number, fecha: Date): string {
    const fechaKey = fecha.toISOString().split('T')[0];
    const data = this.asignacionesTemp[`${idEmpleado}-${fechaKey}`];
    
    if (!data) return '';
    if (data.tipoId === 2) return 'bg-metro';    // Azul claro
    if (data.tipoId === 3) return 'bg-interior'; // Naranja claro
    return 'bg-central';                         // Verde/Gris
  }

  guardarAsignacion(idEmpleado: number, event: any, fecha: Date) {
    const tipoId = event.target.value;
    const fechaKey = fecha.toISOString().split('T')[0];
    const key = `${idEmpleado}-${fechaKey}`;

    // Guardamos en nuestro objeto temporal
    this.asignacionesTemp[key] = {
      tipoId: parseInt(tipoId),
      cantidad: 0 // Por defecto 0, o puedes capturarlo de un input
    };

    console.log(`Guardado: Empleado ${idEmpleado}, Fecha ${fechaKey}, Tipo ${tipoId}`);
    
    // Lógica extra: Si es "Interior" (ID 3), actualizamos el contador visual
    if (tipoId === '3') {
      const emp = this.empleados.find(e => e.idEmpleado === idEmpleado);
      if (emp) emp.stats.totalInterior++;
    }
  }

  // 2. Función para cambiar el color de la celda dinámicamente
  getClaseSegunAsignacion(idEmpleado: number, fecha: Date): string {
    const fechaKey = fecha.toISOString().split('T')[0];
    const data = this.asignacionesTemp[`${idEmpleado}-${fechaKey}`];
    
    if (!data || !data.tipoId) return '';

    // Retornamos el nombre de la clase CSS según el ID del tipo
    switch (data.tipoId) {
      case 1: return 'bg-central';  // Sede Central
      case 2: return 'bg-metro';    // Metro
      case 3: return 'bg-interior'; // Interior
      case 4: return 'bg-exterior'; // Exterior
      default: return '';
    }
}
}