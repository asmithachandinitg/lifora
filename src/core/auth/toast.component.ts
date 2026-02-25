import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../auth/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        class="toast"
        [class]="'toast-' + t.type"
        *ngFor="let t of toastService.toasts$ | async"
      >
        <span class="material-icons toast-icon">{{ getIcon(t.type) }}</span>
        <span class="toast-msg">{{ t.message }}</span>
        <span class="material-icons toast-close" (click)="toastService.dismiss(t.id)">close</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 28px;
      right: 28px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Segoe UI', sans-serif;
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      min-width: 280px;
      max-width: 380px;
      animation: slideIn 0.25s ease;
    }

    .toast-success { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
    .toast-warning { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; }
    .toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .toast-info    { background: #f5f3ff; color: #6d28d9; border: 1px solid #c4b5fd; }

    .toast-icon { font-size: 20px; flex-shrink: 0; }
    .toast-msg  { flex: 1; line-height: 1.4; }
    .toast-close {
      font-size: 18px;
      cursor: pointer;
      opacity: 0.6;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .toast-close:hover { opacity: 1; }

    @keyframes slideIn {
      from { transform: translateX(40px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: Toast['type']): string {
    return { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' }[type];
  }
}
