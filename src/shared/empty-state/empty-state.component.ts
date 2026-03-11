import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-illustration">{{ illustration }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-desc">{{ description }}</p>
      <button *ngIf="actionLabel" class="empty-action" (click)="onAction()">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 56px 24px; text-align: center;
    }
    .empty-illustration {
      font-size: 56px; margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-8px); }
    }
    .empty-title {
      font-size: 1.1rem; font-weight: 700;
      color: var(--text); margin: 0 0 8px;
    }
    .empty-desc {
      font-size: 0.9rem; color: var(--text-muted);
      margin: 0 0 24px; max-width: 280px; line-height: 1.6;
    }
    .empty-action {
      padding: 10px 24px; border-radius: 12px; border: none;
      background: var(--primary); color: white;
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s;
    }
    .empty-action:hover { opacity: 0.85; }
  `]
})
export class EmptyStateComponent {
  @Input() illustration = '📭';
  @Input() title = 'Nothing here yet';
  @Input() description = 'Add your first entry to get started.';
  @Input() actionLabel = '';
  @Input() onAction: () => void = () => {};
}
