import { ApplicationConfig, provideZoneChangeDetection,LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEsDO from '@angular/common/locales/es-DO';
registerLocaleData(localeEsDO, 'es-DO');

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
  HttpClient, provideHttpClient(withInterceptors([])),
{ provide: LOCALE_ID, useValue: 'es-DO' }]
};
