import { HttpClient } from '@angular/common/http';
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


  signIn(user : IUser):Observable<any>{
    return this.http.post(`${this.apiUrl}/users/newuser`, user);
  }


  login(credentials: ILoginRequest) {
  return this.http.post<ILoginResponseToken>(
    `${this.apiUrl}/auth/login`,
    credentials
  );
}


  estaLogueado(): boolean {
    const token = localStorage.getItem('sca_token');

    if(!token){
      return false;
    }
    const expiracion = localStorage.getItem('tokenExpiration')!;
    const expiracionDate = new Date(expiracion);

    if(expiracionDate <= new Date()){

      return false;
    }
    return true;
  }

  obtenerCampoJWT (campo: string): string {
    const token = localStorage.getItem('sca_token');
    if(!token){
      return '';
    }
    //obtener el campo del token:payload:data
    const dataToken = JSON.parse(atob(token.split('.')[1]));
    return dataToken[campo];
  }

  obtenerUsuarios():Observable<IUser[]>{
    return this.http.get<IUser[]>(`${this.apiUrl}/users`);
  }

  obtenerUsuarioById(id: number):Observable<IUser>{
    return this.http.get<IUser>(`${this.apiUrl}/users/${id}`);
  }

  changePassword(newPassword: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/auth/change-password`, { newPassword });
}

}
