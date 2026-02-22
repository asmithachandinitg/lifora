
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideQuillConfig } from 'ngx-quill';

import { routes } from './app.routes';
import { authInterceptor } from '../core/auth/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

     provideQuillConfig({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ size: [] }],
          [{ list: 'ordered' },
           { list: 'bullet' }],
          ['clean']
        ]
      }
    })
  ]
};
