// src/core/interceptors/error.interceptor.ts
//
// Catches all HTTP errors globally and shows a toast.
// You don't need to handle errors in every component — this does it for you.
// For specific components that need custom error messages (like login), 
// they can still catch errors themselves — this is just the fallback.

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      // Don't show a generic toast for login/register —
      // those components handle their own error messages
      const isAuthRoute =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register');

      if (!isAuthRoute) {
        switch (error.status) {
          case 0:
            // No connection — server is down or network issue
            toast.show('Cannot reach the server. Check your connection.', 'error');
            break;

          case 401:
            // Token expired or invalid — log out and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.show('Your session has expired. Please log in again.', 'warning');
            router.navigate(['/login']);
            break;

          case 403:
            toast.show('You do not have permission to do that.', 'error');
            break;

          case 404:
            toast.show('The requested resource was not found.', 'error');
            break;

          case 500:
            toast.show('Something went wrong on the server. Please try again.', 'error');
            break;

          default:
            // Generic fallback for anything else
            const message = error.error?.message || 'Something went wrong.';
            toast.show(message, 'error');
        }
      }

      return throwError(() => error);
    })
  );
};
