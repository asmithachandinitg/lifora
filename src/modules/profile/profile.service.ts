import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './profile.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/change-password`, data);
  }

  updateModules(modules: { key: string; enabled: boolean }[]): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/modules`, { modules });
  }
}
