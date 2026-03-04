import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PregnancyEntry, PregnancyProfile } from './pregnancy.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PregnancyService {
private baseUrl = `${environment.apiUrl}/pregnancy`;

  constructor(private http: HttpClient) {}

  // Profile
  getProfile(): Observable<PregnancyProfile> {
    return this.http.get<PregnancyProfile>(`${this.baseUrl}/profile`);
  }

  saveProfile(data: Partial<PregnancyProfile>): Observable<PregnancyProfile> {
    return this.http.post<PregnancyProfile>(`${this.baseUrl}/profile`, data);
  }

  // Entries
  getEntries(): Observable<PregnancyEntry[]> {
    return this.http.get<PregnancyEntry[]>(this.baseUrl);
  }

  getEntry(id: string): Observable<PregnancyEntry> {
    return this.http.get<PregnancyEntry>(`${this.baseUrl}/${id}`);
  }

  createEntry(data: Partial<PregnancyEntry>): Observable<PregnancyEntry> {
    return this.http.post<PregnancyEntry>(this.baseUrl, data,);
  }

  updateEntry(id: string, data: Partial<PregnancyEntry>): Observable<PregnancyEntry> {
    return this.http.put<PregnancyEntry>(`${this.baseUrl}/${id}`, data,);
  }

  deleteEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`,);
  }
}
