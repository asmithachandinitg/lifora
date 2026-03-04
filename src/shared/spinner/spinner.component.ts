// src/shared/spinner/spinner.component.ts
//
// A full-page spinner that shows whenever an HTTP request is in flight.
// Add <app-spinner /> once in your app.component.html and it handles itself.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" *ngIf="loading.loading$ | async">
      <div class="spinner-box">
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      backdrop-filter: blur(2px);
    }

    .spinner-box {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #EDE9FE;
      border-top-color: #8B5CF6;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  constructor(public loading: LoadingService) {}
}
