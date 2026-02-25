import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PregnancyEntry, PregnancyProfile } from './pregnancy.model';

@Injectable({ providedIn: 'root' })
export class PregnancyService {
  private baseUrl = 'http://localhost:5000/api/pregnancy';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Profile
  getProfile(): Observable<PregnancyProfile> {
    return this.http.get<PregnancyProfile>(`${this.baseUrl}/profile`, { headers: this.getHeaders() });
  }

  saveProfile(data: Partial<PregnancyProfile>): Observable<PregnancyProfile> {
    return this.http.post<PregnancyProfile>(`${this.baseUrl}/profile`, data, { headers: this.getHeaders() });
  }

  // Entries
  getEntries(): Observable<PregnancyEntry[]> {
    return this.http.get<PregnancyEntry[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getEntry(id: string): Observable<PregnancyEntry> {
    return this.http.get<PregnancyEntry>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  createEntry(data: Partial<PregnancyEntry>): Observable<PregnancyEntry> {
    return this.http.post<PregnancyEntry>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateEntry(id: string, data: Partial<PregnancyEntry>): Observable<PregnancyEntry> {
    return this.http.put<PregnancyEntry>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
