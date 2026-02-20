import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']

})
export class LoginComponent {

  email = '';
  password = '';
  submitted = false;
  showPassword = false;
  emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  loginError = '';
  loading = false;
  showForgot = false;
  forgotEmail = '';
  forgotMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  loginUser() {

    this.submitted = true;
    this.loginError = '';

    if (
      !this.email ||
      !this.password ||
      !this.emailPattern.test(this.email)
    ) {
      return;
    }

    const payload = {
      email: this.email,
      password: this.password
    };

    this.auth.login(payload)
      .subscribe({

        next: (res: any) => {

          this.auth.saveToken(res.token);

          this.auth.loadUser()
            .subscribe(() => {
              this.router.navigate(['/']);
            });

        },

        error: err => {

          this.loginError =
            err?.error?.message ||
            'Invalid email or password';

          setTimeout(() => {
            this.loginError = '';
          }, 5000);

        }

      });
  }

  clearError() {
    this.loginError = '';
  }

}