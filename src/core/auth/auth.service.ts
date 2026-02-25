import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
private userSubject = new BehaviorSubject<any>(this.getUser());
user$ = this.userSubject.asObservable();

  private apiUrl =
    'http://localhost:5000/api/users';

private user: any = null;


  constructor(
    private http: HttpClient
  ) {}

  register(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('token');
  }

getProfile() {
  return this.http.get('http://localhost:5000/api/users/profile');
}

loadUser() {
  return this.getProfile().pipe(
    tap((res: any) => {
      this.user = res;
    })
  );
}

forgotPassword(email: string) {
  return this.http.post(
    '/api/users/forgot-password',
    { email }
  );
}

updateModules(modules: { key: string; enabled: boolean }[]): void {
  const user = this.getUser();
  if (user) {
    user.modules = modules;
    this.setUser(user);
  }
}

setUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
  this.userSubject.next(user);
}

getUser(): any {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

}
