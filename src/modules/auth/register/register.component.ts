import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {

  firstName = '';
  lastName = '';
  email = '';
  gender = '';
  password = '';
  confirmPassword = '';

  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;

  emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  passwordPattern =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/;

constructor(
  private auth: AuthService,
  private router: Router
) {}

registerUser() {

  this.submitted = true;

  // FORM VALIDATION
  if (
    !this.firstName ||
    !this.lastName ||
    !this.email ||
    !this.gender ||
    !this.password ||
    !this.confirmPassword ||
    this.password !== this.confirmPassword
  ) {
    return;
  }

  // ✅ CONVERT TO LOWERCASE BEFORE SENDING
  const registerPayload = {
    firstName: this.firstName.trim(),
    lastName: this.lastName.trim(),
    email: this.email.trim().toLowerCase(),
    gender: this.gender.toLowerCase(),  // ← LOWERCASE
    password: this.password
  };

  // =========================
  // 1️⃣ REGISTER
  // =========================

  this.auth.register(registerPayload)
    .subscribe({

      next: () => {
        const loginPayload = {
          email: this.email.trim().toLowerCase(),  // ← LOWERCASE
          password: this.password
        };

        this.auth.login(loginPayload)
          .subscribe({

            next: (res: any) => {
              // Save token
              this.auth.saveToken(res.token);

              // Redirect dashboard
              this.router.navigate(['/dashboard']);
            },

            error: err => {
              console.error('Auto login failed', err);
            }
          });
      },

      error: err => {
        console.error('Register failed', err);
        alert(err.error?.message || 'Registration error');
      }
    });
}

  passwordRules = {
    length: false,
    capital: false,
    number: false,
    special: false
  };


  checkStrength() {

    const value = this.password;

    this.passwordRules.length =
      value.length >= 8;

    this.passwordRules.capital =
      /[A-Z]/.test(value);

    this.passwordRules.number =
      /[0-9]/.test(value);

    this.passwordRules.special =
      /[\W_]/.test(value);

    this.passwordStrength =
      Object.values(
        this.passwordRules
      ).filter(Boolean).length;
  }

}
