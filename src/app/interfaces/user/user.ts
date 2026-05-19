export interface IUser {
  userId: number;
  empleadoId: number;
  username: string;
  nombre: string;
  codigo: string;
  cedula: string;
  departamento: number;
  cargo: number;
  rol: number;
   nombreRol:   string;  
  permisos:    string[];  

}

export interface ILoginRequest {
  username: string;
  password: string;
}