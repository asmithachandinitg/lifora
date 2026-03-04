// src/core/interceptors/loading.interceptor.ts
//
// Automatically shows a loading state when any HTTP request is in flight
// and hides it when done. No need to manually set loading = true/false
// in every component.

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.show();

  return next(req).pipe(
    finalize(() => loading.hide())
  );
};
