import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email = '';
  message = '';

  constructor(
    private auth: AuthService
  ) {}

  sendReset() {

    if (!this.email) return;

    this.auth
      .forgotPassword(this.email)
      .subscribe({

        next: (res: any) => {
          this.message = res.message;
        },

        error: err => {
          this.message =
            err?.error?.message ||
            'Something went wrong';
        }
      });
  }
}
