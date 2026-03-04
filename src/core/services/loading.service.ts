// src/core/services/loading.service.ts
//
// A simple service to track loading state across the app.
// Components can call loading.show() / loading.hide(),
// or use the loading interceptor to do it automatically on every HTTP request.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0; // tracks overlapping requests
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  show() {
    this.count++;
    this.loadingSubject.next(true);
  }

  hide() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      this.loadingSubject.next(false);
    }
  }
}
