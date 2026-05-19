import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket }            from 'socket.io-client';
import { Observable }            from 'rxjs';
import { environment }           from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket;

  constructor() {
    const serverUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });
  }

  /** Escucha un evento del servidor — limpia el listener al desuscribirse */
  escucharEvento(nombreEvento: string): Observable<any> {
    return new Observable((subscriber) => {
      const handler = (data: any) => subscriber.next(data);
      this.socket.on(nombreEvento, handler);

      // ← ESTO es lo que faltaba: limpia el listener cuando el componente se destruye
      return () => this.socket.off(nombreEvento, handler);
    });
  }

  /** Envía un evento al servidor con datos opcionales */
  emitir(nombreEvento: string, data?: any): void {
    this.socket.emit(nombreEvento, data);
  }

  /** Desconecta al cerrar la app */
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}