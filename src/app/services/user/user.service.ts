import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { ILoginRequest, IUser } from '../../interfaces/user/user';
import { Observable } from 'rxjs';
import { ILoginResponseToken } from '../../interfaces/user/loginResponseToken';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http: HttpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
constructor() { 
    
  }
  

  signIn(user : IUser):Observable<any>{
    return this.http.post(`${this.apiUrl}/newuser`, user);
  }


  login(credentials: ILoginRequest) {
  return this.http.post<ILoginResponseToken>(
    `${this.apiUrl}/user/login`,
    credentials
  );
}

  logout(){
    localStorage.removeItem('sca_token');
  localStorage.removeItem('sca_refresh_token');
  localStorage.removeItem('sca_user');
  }

  estaLogueado(): boolean {
    const token = localStorage.getItem('token');

    if(!token){
      return false;
    }
    const expiracion = localStorage.getItem('tokenExpiration')!;
    const expiracionDate = new Date(expiracion);

    if(expiracionDate <= new Date()){
      this.logout();
      return false;
    }
    return true;
  }

  obtenerCampoJWT (campo: string): string {
    const token = localStorage.getItem('token');
    if(!token){
      return '';
    }
    //obtener el campo del token:payload:data
    const dataToken = JSON.parse(atob(token.split('.')[1]));
    return dataToken[campo];
  }

  obtenerUsuarios():Observable<IUser[]>{
    return this.http.get<IUser[]>(`${this.apiUrl}/user/getAllUsers`);
  }

  obtenerUsuarioById(id: number):Observable<IUser>{
    return this.http.get<IUser>(`${this.apiUrl}/user/getUser/${id}`);
  }

  changePassword(newPassword: string): Observable<any> {
     const token = localStorage.getItem('sca_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put(`${this.apiUrl}/user/change-password`, { newPassword }, { headers });
  }

}
