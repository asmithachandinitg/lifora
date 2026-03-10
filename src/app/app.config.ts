// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideQuillConfig } from 'ngx-quill';

import { routes } from './app.routes';
import { authInterceptor }    from '../core/auth/interceptors/auth.interceptor';
import { errorInterceptor }   from '../core/auth/interceptors/error.interceptor';
import { loadingInterceptor } from '../core/auth/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor,    
        loadingInterceptor, 
        errorInterceptor,   
      ])
    ),

    provideQuillConfig({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ size: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean']
        ]
      }
    })
  ]
};
