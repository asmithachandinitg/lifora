import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`, { headers: this.getHeaders() });
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, data, { headers: this.getHeaders() });
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/change-password`, data, { headers: this.getHeaders() });
  }

  updateModules(modules: { key: string; enabled: boolean }[]): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/modules`, { modules }, { headers: this.getHeaders() });
  }
}
