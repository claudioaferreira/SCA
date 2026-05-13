// La estructura plana de un empleado
export interface CumpleaneroAPI {
  id: number;
  nombre: string;
  codigo: string;
  EdadActual: number;
  FechaCelebracion: string; 
}

// NUEVO: La estructura exacta que devuelve tu backend
export interface BdayApiResponse {
  error: boolean;
  status: number;
  body: CumpleaneroAPI[];
}

// Para el frontend (HTML)
export interface BdayPersona {
  nombre: string;
  codigo: string;
  edad: number;
}

export interface BdayGrupo {
  label: string;
  esHoy: boolean;
  diasFaltantes: number;
  personas: BdayPersona[];
}