import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl =
    'http://localhost:5000/api/users';

private user: any = null;


  constructor(
    private http: HttpClient
  ) {}



  // =========================
  // REGISTER
  // =========================

  register(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }



  // =========================
  // LOGIN
  // =========================

  login(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );
  }



  // =========================
  // TOKEN STORAGE
  // =========================

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }



  getToken(): string | null {
    return localStorage.getItem('token');
  }



  // =========================
  // LOGIN STATE
  // =========================

  isLoggedIn(): boolean {
    return !!this.getToken();
  }



  // =========================
  // LOGOUT
  // =========================

  logout() {
    localStorage.removeItem('token');
  }

  /* PROFILE API */
getProfile() {
  return this.http.get('http://localhost:5000/api/users/profile');
}

/* LOAD + CACHE */
loadUser() {
  return this.getProfile().pipe(
    tap((res: any) => {
      this.user = res;
    })
  );
}

/* GET CACHED USER */
getUser() {
  return this.user;
}

forgotPassword(email: string) {
  return this.http.post(
    '/api/users/forgot-password',
    { email }
  );
}

}
