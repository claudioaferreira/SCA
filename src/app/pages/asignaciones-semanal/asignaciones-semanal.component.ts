import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Empleado,
  TipoAsignacion,
} from '../../interfaces/asignacion.interface';

@Component({
  selector: 'app-asignaciones-semanal',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './asignaciones-semanal.component.html',
  styleUrls: ['./asignaciones-semanal.component.scss'],
})
export class AsignacionesSemanalComponent implements OnInit {
  // --- 1. PROPIEDADES (Los datos de la página) ---
  terminoBusqueda: string = '';
  diasSemana: Date[] = [];
  tipos: TipoAsignacion[] = [
    { idTipo: 1, nombre: 'Sede Central' },
    { idTipo: 2, nombre: 'Metro' },
    { idTipo: 3, nombre: 'Interior' },
    { idTipo: 4, nombre: 'Exterior' },
  ];

  // Memoria temporal: Aquí guardamos lo que escribes en la tabla antes de ir a SQL
  dataTemporal: any = {};

  // Tu lista de técnicos (Asegúrate de tener a los 102 aquí)
  empleadosMaster: Empleado[] = [
    {
      id: 1,
      nombre: 'Fernando Arturo Rodriguez Ogando',
      codigo: '19990415',
      cedula: '00147854581',
      telefonoFlota: '809-555-1234',
      telefonoPersonal: '809-555-5678',
      ubicacion: 'Almacén',
      localidad: 'Las Colinas',
      posicion: 'Soporte Tecnico',
      stats: {
        totalInterior: 5,
        metroMes: 3,
        totalSede: 2,
        diasNorte: 1,
        diasSur: 1,
        diasEste: 1,
      },
    },
    {
      id: 101,
      nombre: 'Juan Carlos Tejada',
      codigo: '20210186',
      cedula: '00147854581',
      telefonoFlota: '809-555-5678',
      telefonoPersonal: '809-555-1234',
      ubicacion: 'Soporte Tecnico',
      localidad: 'Las Colinas',
      posicion: 'Auxiliar Técnico',
      stats: {
        totalInterior: 40,
        metroMes: 6,
        totalSede: 0,
        diasNorte: 2,
        diasSur: 2,
        diasEste: 1,
      },
    },
  ];

  // --- 2. INICIO (Lo que pasa al abrir la página) ---
  ngOnInit() {
    this.generarCalendarioSemanal();
    this.ordenarListaAlfabeticamente();
  }

  generarCalendarioSemanal() {
    const hoy = new Date();
    // Buscamos el lunes de esta semana
    const lunes = new Date(
      hoy.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1)),
    );

    this.diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      this.diasSemana.push(dia);
    }
  }

  ordenarListaAlfabeticamente() {
    this.empleadosMaster.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // --- 3. LÓGICA DE LA TABLA (Interacción) ---

  // Se activa al elegir Sede, Metro, Interior, etc.
  manejarCambioTipo(empId: number, fecha: Date, event: any) {
    const seleccion = parseInt(event.target.value);
    const key = this.generarLlave(empId, fecha);

    // Si el día ya pasó, pedimos confirmación
    if (this.esDiaPasado(fecha)) {
      if (!confirm('Este día ya pasó. ¿Deseas modificarlo?')) {
        event.target.value = '0';
        return;
      }
    }

    // Si no existe el registro en memoria, lo creamos
    if (!this.dataTemporal[key]) {
      this.dataTemporal[key] = { tipoId: 0, cantidad: 0, dias: 0, zona: '' };
    }
    this.dataTemporal[key].tipoId = seleccion;
  }

  // Se activa al escribir Cantidad, Días o Zona
  actualizarDataExtra(empId: number, fecha: Date, campo: string, event: any) {
    const valor = event.target.value;
    const key = this.generarLlave(empId, fecha);

    if (!this.dataTemporal[key]) return;

    // Guardamos según el campo que se escribió
    if (campo === 'cantidad')
      this.dataTemporal[key].cantidad = parseInt(valor) || 0;
    if (campo === 'dias') this.dataTemporal[key].dias = parseInt(valor) || 0;
    if (campo === 'zona') this.dataTemporal[key].zona = valor;

    this.actualizarResumenVisual(empId, campo, valor, key);
  }

  // --- 4. AYUDAS VISUALES (Colores y Filtros) ---

  getClaseColor(empId: number, fecha: Date): string {
    const tipo = this.obtenerTipoSeleccionado(empId, fecha);
    let clases = '';

    if (this.esDiaPasado(fecha)) clases += 'bg-dia-pasado ';
    if (tipo === 1) clases += 'bg-info-subtle '; // Color para Sede
    if (tipo === 3) clases += 'bg-warning-subtle '; // Color para Interior

    return clases;
  }

  filtrarEmpleados(): Empleado[] {
    const busqueda = this.terminoBusqueda.toLowerCase();
    return this.empleadosMaster.filter(
      (e) =>
        e.nombre.toLowerCase().includes(busqueda) ||
        e.localidad.toLowerCase().includes(busqueda) ||
        e.codigo.includes(busqueda),
    );
  }

  // --- 5. FUNCIONES INTERNAS (No se tocan) ---

  private generarLlave(id: number, fecha: Date): string {
    return id + '-' + fecha.toISOString().split('T')[0];
  }

  private esDiaPasado(fecha: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f < hoy;
  }

  obtenerTipoSeleccionado(empId: number, fecha: Date): number {
    const key = this.generarLlave(empId, fecha);
    return this.dataTemporal[key]?.tipoId || 0;
  }

  private actualizarResumenVisual(
    empId: number,
    campo: string,
    valor: any,
    key: string,
  ) {
    const emp = this.empleadosMaster.find((e) => e.id === empId);
    if (!emp) return;

    if (campo === 'cantidad') emp.stats.totalSede += 1;
    if (campo === 'zona' || campo === 'dias') {
      const { zona, dias } = this.dataTemporal[key];
      if (zona === 'Norte') emp.stats.diasNorte += dias;
      if (zona === 'Sur') emp.stats.diasSur += dias;
      if (zona === 'Este') emp.stats.diasEste += dias;
      emp.stats.totalInterior =
        emp.stats.diasNorte + emp.stats.diasSur + emp.stats.diasEste;
    }
  }

  guardarTodo() {
    console.log('JSON PARA SQL SERVER:', this.dataTemporal);
    alert('¡Datos listos en consola!');
  }
}
