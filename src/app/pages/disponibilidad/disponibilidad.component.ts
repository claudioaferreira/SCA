import { Component } from '@angular/core';
import { DisponibilidadService } from '../../services/disponibilidad.service';
import { LogisticaService } from '../../services/logistica.service';
import { Empleado } from '../../interfaces/asignacion.interface';

@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  imports: [],
  templateUrl: './disponibilidad.component.html',
  styleUrl: './disponibilidad.component.scss',
})
export class DisponibilidadComponent {
  constructor(
    public dispService: DisponibilidadService,
    private logistica: LogisticaService,
    
  ) {}
  idSeleccionado: number = 0;
  fechaInicio: string = '';
  fechaFin: string = '';

  empleados = [
  { id: 1, nombre: 'Fernando Arturo Rodriguez Ogando', codigo: '19990415', localidad: 'Almacén', stats: { totalInterior: 5, metroMes: 3, totalSede: 2, diasNorte: 1, diasSur: 1, diasEste: 1, estaDisponible:false } },
  { id: 2, nombre: 'Cesar rafael Meran Perdomo', codigo: '20261133', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 2, metroMes: 4, totalSede: 1, diasNorte: 2, diasSur: 1, diasEste: 1, estaDisponible:true } },
  { id: 3, nombre: 'Raimy Chanilk Beriguete Hernandez', codigo: '20261130', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 1, metroMes: 2, totalSede: 1, diasNorte: 1, diasSur: 1, diasEste: 0, estaDisponible:true } },
  { id: 4, nombre: 'Kevin Rafael Rodriguez Perdomo', codigo: '20261134', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 3, metroMes: 5, totalSede: 2, diasNorte: 2, diasSur: 2, diasEste: 1, estaDisponible:false } },
  { id: 5, nombre: 'Leonel David Reyes Lorenzo', codigo: '20131182', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 2, metroMes: 3, totalSede: 1, diasNorte: 1, diasSur: 1, diasEste: 1, estaDisponible:true } },
  { id: 6, nombre: 'Joniel Luis Matos', codigo: '20231173', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 4, metroMes: 6, totalSede: 2, diasNorte: 2, diasSur: 2, diasEste: 2, estaDisponible:false } },
  { id: 7, nombre: 'Adrian Jose Jara Ramirez', codigo: '20261149', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 3, metroMes: 4, totalSede: 1, diasNorte: 1, diasSur: 2, diasEste: 1 } },
  { id: 8, nombre: 'Ismael Mateo Marte', codigo: '20261148', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 5, metroMes: 7, totalSede: 2, diasNorte: 3, diasSur: 2, diasEste: 2 } },
  { id: 9, nombre: 'Johan Santiago Rodriguez', codigo: '20231167', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 2, metroMes: 3, totalSede: 1, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 10, nombre: 'Johnny Esteban Cruz Rodriguez', codigo: '20261147', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 6, metroMes: 5, totalSede: 2, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 11, nombre: 'Deivy Francisco Méndez Rivas', codigo: '20240609', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 1, metroMes: 2, totalSede: 3, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 12, nombre: 'Abimael Ramirez Rodriguez', codigo: '20261150', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 4, metroMes: 3, totalSede: 1, diasNorte: 2, diasSur: 1, diasEste: 1, estaDisponible:false } },
  { id: 13, nombre: 'Franklin Vargas Rodriguez', codigo: '20081097', localidad: 'Almacén', stats: { totalInterior: 0, metroMes: 4, totalSede: 5, diasNorte: 0, diasSur: 0, diasEste: 0 } },
  { id: 14, nombre: 'Oalzi Soler', codigo: '20080936', localidad: 'Almacén', stats: { totalInterior: 2, metroMes: 1, totalSede: 4, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 15, nombre: 'Evelyn Vanesa Martinez Trinidad', codigo: '20190290', localidad: 'JEDN', stats: { totalInterior: 8, metroMes: 5, totalSede: 1, diasNorte: 3, diasSur: 3, diasEste: 2 } },
  { id: 16, nombre: 'Luis Miguel Crespo Duarte', codigo: '20090218', localidad: 'JEDN', stats: { totalInterior: 10, metroMes: 4, totalSede: 0, diasNorte: 4, diasSur: 4, diasEste: 2 } },
  { id: 17, nombre: 'Michael Raymond Boitel', codigo: '20030371', localidad: 'JEDN', stats: { totalInterior: 15, metroMes: 6, totalSede: 2, diasNorte: 5, diasSur: 5, diasEste: 5 } },
  { id: 18, nombre: 'Pamela Feliz Matos', codigo: '20160085', localidad: 'JEDN', stats: { totalInterior: 3, metroMes: 8, totalSede: 5, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 19, nombre: 'Pedro Carrasco', codigo: '19990045', localidad: 'JEDN', stats: { totalInterior: 20, metroMes: 2, totalSede: 1, diasNorte: 7, diasSur: 7, diasEste: 6 } },
  { id: 20, nombre: 'Isidro Rodríguez', codigo: '20210631', localidad: 'Mao', stats: { totalInterior: 30, metroMes: 1, totalSede: 0, diasNorte: 15, diasSur: 10, diasEste: 5 } },
  { id: 21, nombre: 'Segismundo Feliz', codigo: '20090507', localidad: 'Santiago', stats: { totalInterior: 25, metroMes: 3, totalSede: 0, diasNorte: 12, diasSur: 8, diasEste: 5 } },
  { id: 22, nombre: 'Berkis Fortuna', codigo: '20090285', localidad: 'Soporte Edf Proyecto', stats: { totalInterior: 5, metroMes: 10, totalSede: 8, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 23, nombre: 'Jorge Oscar Jimenez', codigo: '20121086', localidad: 'Soporte Edf Proyecto', stats: { totalInterior: 4, metroMes: 9, totalSede: 7, diasNorte: 1, diasSur: 2, diasEste: 1 } },
  { id: 24, nombre: 'Carlos Ant. Betances R.', codigo: '19960172', localidad: 'Soporte Tecnico', stats: { totalInterior: 12, metroMes: 5, totalSede: 2, diasNorte: 4, diasSur: 4, diasEste: 4 } },
  { id: 25, nombre: 'Rafel Erneso Perez Sena', codigo: '20090302', localidad: 'Soporte Tecnico', stats: { totalInterior: 7, metroMes: 6, totalSede: 3, diasNorte: 3, diasSur: 2, diasEste: 2 } },
  { id: 26, nombre: 'Daniel Josue Rodriguez Pereira', codigo: '20220338', localidad: 'Soporte Tecnico', stats: { totalInterior: 9, metroMes: 4, totalSede: 1, diasNorte: 3, diasSur: 3, diasEste: 3 } },
  { id: 27, nombre: 'Rafael Antonio Ramos De Los Santos', codigo: '19950074', localidad: 'Soporte Tecnico', stats: { totalInterior: 18, metroMes: 2, totalSede: 0, diasNorte: 6, diasSur: 6, diasEste: 6 } },
  { id: 28, nombre: 'Suhey Alexandra Anselmo Rosario', codigo: '20020050', localidad: 'Soporte Tecnico', stats: { totalInterior: 4, metroMes: 12, totalSede: 10, diasNorte: 1, diasSur: 1, diasEste: 2 } },
  { id: 29, nombre: 'Albieris Abraham Osoria Ovalle', codigo: '20231147', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 15, totalSede: 20, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 30, nombre: 'Ana Montas', codigo: '20160290', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 18, totalSede: 25, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 31, nombre: 'Carlos Alberto Torres Hernandez', codigo: '19971318', localidad: 'Taller Informatica', stats: { totalInterior: 3, metroMes: 14, totalSede: 15, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 32, nombre: 'Elvin Vasquez', codigo: '19980574', localidad: 'Taller Informatica', stats: { totalInterior: 5, metroMes: 10, totalSede: 12, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 33, nombre: 'María M. Flores Feliz', codigo: '20200090', localidad: 'Taller Informatica', stats: { totalInterior: 0, metroMes: 20, totalSede: 30, diasNorte: 0, diasSur: 0, diasEste: 0 } },
  { id: 34, nombre: 'Neurianny Montero Montero', codigo: '20231394', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 12, totalSede: 15, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 35, nombre: 'Amaury Javier Fernandez Ramos', codigo: '20190331', localidad: 'Santiago', stats: { totalInterior: 22, metroMes: 4, totalSede: 1, diasNorte: 10, diasSur: 7, diasEste: 5 } },
  { id: 36, nombre: 'Jeffrey Rafael Mateo', codigo: '20261132', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 3, metroMes: 5, totalSede: 2, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 37, nombre: 'Alex Alfredo Hernandez Frias', codigo: '20231385', localidad: 'Aux Sop. Tec.', stats: { totalInterior: 4, metroMes: 4, totalSede: 1, diasNorte: 2, diasSur: 1, diasEste: 1 } },
  { id: 38, nombre: 'Christal Rosario Guzman', codigo: '20241096', localidad: 'Santiago', stats: { totalInterior: 15, metroMes: 3, totalSede: 0, diasNorte: 7, diasSur: 5, diasEste: 3 } },
  { id: 39, nombre: 'Junior Starling Rodriguez Perez', codigo: '20232014', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 10, totalSede: 14, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 40, nombre: 'Heidy Veloz', codigo: '20191162', localidad: 'Soporte Tecnico', stats: { totalInterior: 6, metroMes: 8, totalSede: 4, diasNorte: 2, diasSur: 2, diasEste: 2 } },
  { id: 41, nombre: 'Johan Miguel Polanco Luna', codigo: '20090126', localidad: 'Taller Informatica', stats: { totalInterior: 3, metroMes: 15, totalSede: 20, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 42, nombre: 'Franklin Antonio Peña Recio', codigo: '20120449', localidad: 'JE SDE', stats: { totalInterior: 8, metroMes: 4, totalSede: 2, diasNorte: 3, diasSur: 3, diasEste: 2 } },
  { id: 43, nombre: 'Frank Cesar Martínez', codigo: '19960062', localidad: 'Almacén', stats: { totalInterior: 1, metroMes: 2, totalSede: 6, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 44, nombre: 'Daniel Arias', codigo: '20232008', localidad: 'Almacen (KAN KAN)', stats: { totalInterior: 2, metroMes: 3, totalSede: 5, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 45, nombre: 'Daisy Bethania Torres Gonzalez', codigo: '20231153', localidad: 'Taller Informatica', stats: { totalInterior: 0, metroMes: 12, totalSede: 18, diasNorte: 0, diasSur: 0, diasEste: 0 } },
  { id: 46, nombre: 'Jarleny Sanchez', codigo: '20140911', localidad: 'Taller Informatica', stats: { totalInterior: 4, metroMes: 10, totalSede: 12, diasNorte: 2, diasSur: 1, diasEste: 1 } },
  { id: 47, nombre: 'Yenifer Frias', codigo: '20210028', localidad: 'Soporte Tecnico', stats: { totalInterior: 5, metroMes: 9, totalSede: 3, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 48, nombre: 'Claudio Argenis Ferreira', codigo: '20190408', localidad: 'Soporte Tecnico', stats: { totalInterior: 12, metroMes: 7, totalSede: 3, diasNorte: 3, diasSur: 2, diasEste: 2 } },
  { id: 49, nombre: 'Carlos Fernando Morel Ramirez', codigo: '19990636', localidad: 'Soporte Tecnico', stats: { totalInterior: 14, metroMes: 5, totalSede: 2, diasNorte: 5, diasSur: 5, diasEste: 4 } },
  { id: 50, nombre: 'Pedro Wagner', codigo: '20140050', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 15, totalSede: 22, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 51, nombre: 'Marcos Montero', codigo: '20090140', localidad: 'Soporte Tecnico', stats: { totalInterior: 10, metroMes: 6, totalSede: 2, diasNorte: 4, diasSur: 3, diasEste: 3 } },
  { id: 52, nombre: 'Javier Ernesto Soriano Terrero', codigo: '20240757', localidad: 'Taller Informatica', stats: { totalInterior: 3, metroMes: 11, totalSede: 15, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 53, nombre: 'Bryan Ivan Then Hernandez', codigo: '20231384', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 13, totalSede: 19, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 54, nombre: 'Julio Angel Martinez', codigo: '20180352', localidad: 'Soporte Edf Proyecto', stats: { totalInterior: 6, metroMes: 8, totalSede: 5, diasNorte: 2, diasSur: 2, diasEste: 2 } },
  { id: 55, nombre: 'Pedro Julio Rosario Crisóstomo', codigo: '20200094', localidad: 'Soporte Tecnico', stats: { totalInterior: 8, metroMes: 7, totalSede: 4, diasNorte: 3, diasSur: 3, diasEste: 2 } },
  { id: 56, nombre: 'Juan Carlos Campusano', codigo: '20030135', localidad: 'Soporte Edf Proyecto', stats: { totalInterior: 11, metroMes: 6, totalSede: 3, diasNorte: 4, diasSur: 4, diasEste: 3 } },
  { id: 57, nombre: 'Deuris Camacho', codigo: '20200064', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 14, totalSede: 20, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 58, nombre: 'Andy de La Cruz', codigo: '19970333', localidad: 'Soporte Tecnico', stats: { totalInterior: 15, metroMes: 4, totalSede: 1, diasNorte: 6, diasSur: 5, diasEste: 4 } },
  { id: 59, nombre: 'Gerson Leon', codigo: '20121021', localidad: 'Soporte Edf Proyecto', stats: { totalInterior: 5, metroMes: 9, totalSede: 6, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 60, nombre: 'Joel Bismar de Oleo', codigo: '20210119', localidad: 'Taller Informatica', stats: { totalInterior: 3, metroMes: 12, totalSede: 17, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 61, nombre: 'Freddy Cabral Encarnacion', codigo: '20080705', localidad: 'Soporte Tecnico', stats: { totalInterior: 12, metroMes: 5, totalSede: 2, diasNorte: 4, diasSur: 4, diasEste: 4 } },
  { id: 62, nombre: 'Irlandis de la Rosa L.', codigo: '20070525', localidad: 'Soporte Tecnico', stats: { totalInterior: 9, metroMes: 7, totalSede: 4, diasNorte: 3, diasSur: 3, diasEste: 3 } },
  { id: 63, nombre: 'Danny Ramses Batista', codigo: '20231154', localidad: 'Soporte Tecnico', stats: { totalInterior: 4, metroMes: 8, totalSede: 5, diasNorte: 1, diasSur: 2, diasEste: 1 } },
  { id: 64, nombre: 'Franthony Sanchez', codigo: '20190384', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 13, totalSede: 18, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 65, nombre: 'Licker Ramon Feliz Urbaez', codigo: '20090633', localidad: 'Barahona', stats: { totalInterior: 28, metroMes: 3, totalSede: 0, diasNorte: 5, diasSur: 18, diasEste: 5 } },
  { id: 66, nombre: 'Anthony Gabriel Feliz Parra', codigo: '20232004', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 14, totalSede: 21, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 67, nombre: 'Yoesxmil Morales D.', codigo: '20200056', localidad: 'Almacén', stats: { totalInterior: 3, metroMes: 2, totalSede: 8, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 68, nombre: 'Wellinton Gabriel Canario Dionisio', codigo: '20240608', localidad: 'Taller Informatica', stats: { totalInterior: 0, metroMes: 15, totalSede: 25, diasNorte: 0, diasSur: 0, diasEste: 0 } },
  { id: 69, nombre: 'Tomás Guerrero Dilone', codigo: '19970048', localidad: 'Soporte Tecnico', stats: { totalInterior: 19, metroMes: 6, totalSede: 2, diasNorte: 2, diasSur: 2, diasEste: 2 } },
  { id: 70, nombre: 'Orlando Mosquea Pereyra', codigo: '20081187', localidad: 'Soporte Tecnico', stats: { totalInterior: 11, metroMes: 5, totalSede: 3, diasNorte: 4, diasSur: 4, diasEste: 3 } },
  { id: 71, nombre: 'Henry Rodriguez Mejia', codigo: '19970026', localidad: 'Soporte Tecnico', stats: { totalInterior: 13, metroMes: 4, totalSede: 2, diasNorte: 5, diasSur: 4, diasEste: 4 } },
  { id: 72, nombre: 'Javier Virgilio Sánchez', codigo: '20191250', localidad: 'Almacén', stats: { totalInterior: 2, metroMes: 3, totalSede: 6, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 73, nombre: 'Luis Jose Beevers', codigo: '20191130', localidad: 'Taller Informatica', stats: { totalInterior: 4, metroMes: 12, totalSede: 16, diasNorte: 2, diasSur: 1, diasEste: 1 } },
  { id: 74, nombre: 'Jose Rigoberto Valerio', codigo: '19940101', localidad: 'Nagua', stats: { totalInterior: 35, metroMes: 2, totalSede: 0, diasNorte: 20, diasSur: 5, diasEste: 10 } },
  { id: 75, nombre: 'Darwin Fernandez', codigo: '20220047', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 14, totalSede: 22, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 76, nombre: 'Camilo Alberto Martinez Villar', codigo: '20090172', localidad: 'Soporte Tecnico', stats: { totalInterior: 10, metroMes: 6, totalSede: 3, diasNorte: 4, diasSur: 3, diasEste: 3 } },
  { id: 77, nombre: 'Gabriel Brito', codigo: '20200076', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 16, totalSede: 24, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 78, nombre: 'Miguel Angel Gaspar', codigo: '20191062', localidad: 'Soporte Tecnico', stats: { totalInterior: 7, metroMes: 9, totalSede: 5, diasNorte: 2, diasSur: 3, diasEste: 2 } },
  { id: 79, nombre: 'Jairo Ramirez Rodriguez', codigo: '20220796', localidad: 'Santiago', stats: { totalInterior: 24, metroMes: 4, totalSede: 1, diasNorte: 10, diasSur: 8, diasEste: 6 } },
  { id: 80, nombre: 'Rafael Alexis Perez Moquete', codigo: '20080927', localidad: 'Soporte Tecnico', stats: { totalInterior: 12, metroMes: 5, totalSede: 3, diasNorte: 4, diasSur: 4, diasEste: 4 } },
  { id: 81, nombre: 'Jonathan Alberto Arias Clariot', codigo: '20140488', localidad: 'Soporte Tecnico', stats: { totalInterior: 9, metroMes: 7, totalSede: 4, diasNorte: 3, diasSur: 3, diasEste: 3 } },
  { id: 82, nombre: 'Marino Alberto Rodriguez Santana', codigo: '20141581', localidad: 'La Romana', stats: { totalInterior: 20, metroMes: 3, totalSede: 0, diasNorte: 5, diasSur: 5, diasEste: 10 } },
  { id: 83, nombre: 'Haney Hernandez', codigo: '20050321', localidad: 'Santiago', stats: { totalInterior: 26, metroMes: 4, totalSede: 0, diasNorte: 12, diasSur: 8, diasEste: 6 } },
  { id: 84, nombre: 'Cherlyn Bencosme Estrella', codigo: '20140749', localidad: 'Almacén', stats: { totalInterior: 3, metroMes: 2, totalSede: 7, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 85, nombre: 'Josué Miguel Peña Baez', codigo: '20231180', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 13, totalSede: 19, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 86, nombre: 'Betty Rodriguez', codigo: '20231151', localidad: 'Soporte Tecnico', stats: { totalInterior: 5, metroMes: 10, totalSede: 6, diasNorte: 2, diasSur: 2, diasEste: 1 } },
  { id: 87, nombre: 'Radhamés Ferreras R.', codigo: '19990892', localidad: 'Soporte Tecnico', stats: { totalInterior: 16, metroMes: 4, totalSede: 1, diasNorte: 6, diasSur: 6, diasEste: 4 } },
  { id: 88, nombre: 'Domingo German', codigo: '20190324', localidad: 'Almacén', stats: { totalInterior: 4, metroMes: 3, totalSede: 5, diasNorte: 1, diasSur: 2, diasEste: 1 } },
  { id: 89, nombre: 'Jose Luis Romero Contreras', codigo: '20030026', localidad: 'Soporte Tecnico', stats: { totalInterior: 14, metroMes: 5, totalSede: 2, diasNorte: 5, diasSur: 5, diasEste: 4 } },
  { id: 90, nombre: 'Luis Adalberto Peña Matos', codigo: '20191368', localidad: 'Taller Informatica', stats: { totalInterior: 1, metroMes: 15, totalSede: 22, diasNorte: 0, diasSur: 1, diasEste: 0 } },
  { id: 91, nombre: 'Angel Martinez Doñe', codigo: '19990425', localidad: 'Taller Informatica', stats: { totalInterior: 29, metroMes: 5, totalSede: 0, diasNorte: 10, diasSur: 10, diasEste: 9 } },
  { id: 92, nombre: 'Manuel Terrero', codigo: '20190410', localidad: 'Almacén', stats: { totalInterior: 3, metroMes: 2, totalSede: 6, diasNorte: 1, diasSur: 1, diasEste: 1 } },
  { id: 93, nombre: 'Jose Maria Sanchez Lopez', codigo: '20230934', localidad: 'Soporte Tecnico', stats: { totalInterior: 6, metroMes: 8, totalSede: 4, diasNorte: 2, diasSur: 2, diasEste: 2 } },
  { id: 94, nombre: 'Amaury Antonio Reynoso Ceballos', codigo: '20090109', localidad: 'Taller Informatica', stats: { totalInterior: 4, metroMes: 13, totalSede: 18, diasNorte: 2, diasSur: 1, diasEste: 1 } },
  { id: 95, nombre: 'Ronald Maria', codigo: '20191129', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 14, totalSede: 20, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 96, nombre: 'Federico Engels Cruz Rodriguez', codigo: '20090385', localidad: 'Soporte Tecnico', stats: { totalInterior: 11, metroMes: 6, totalSede: 3, diasNorte: 4, diasSur: 4, diasEste: 3 } },
  { id: 97, nombre: 'Juan Paniagua Rosario', codigo: '20140447', localidad: 'Soporte Tecnico', stats: { totalInterior: 8, metroMes: 8, totalSede: 5, diasNorte: 3, diasSur: 3, diasEste: 2 } },
  { id: 98, nombre: 'Brian Francisco Estevez López', codigo: '20220702', localidad: 'Soporte Tecnico', stats: { totalInterior: 7, metroMes: 9, totalSede: 4, diasNorte: 2, diasSur: 3, diasEste: 2 } },
  { id: 99, nombre: 'Jorge Luis Concepcion Batista', codigo: '20070582', localidad: 'Soporte Tecnico', stats: { totalInterior: 9, metroMes: 7, totalSede: 3, diasNorte: 3, diasSur: 3, diasEste: 3 } },
  { id: 100, nombre: 'Manuel Reina', codigo: '20160079', localidad: 'Taller Informatica', stats: { totalInterior: 2, metroMes: 16, totalSede: 21, diasNorte: 1, diasSur: 1, diasEste: 0 } },
  { id: 101, nombre: 'Juan Carlos Tejada', codigo: '20210186', localidad: 'Soporte Tecnico', stats: { totalInterior: 40, metroMes: 6, totalSede: 0, diasNorte: 2, diasSur: 2, diasEste: 1 } }
];
  hoy = new Date().toISOString().split('T')[0];

  verificar(id: number) {
    return this.dispService.estaDisponible(id, this.hoy);
  }

  confirmarRuta() {
    if (this.idSeleccionado && this.fechaInicio && this.fechaFin) {
      this.logistica.bloquearTecnico(
        this.idSeleccionado,
        this.fechaInicio,
        this.fechaFin,
      );
      alert('Técnico bloqueado para esas fechas');
    }
  }
}
