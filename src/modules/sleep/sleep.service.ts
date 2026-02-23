import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SleepEntry } from './sleep.model';

@Injectable({ providedIn: 'root' })
export class SleepService {
  private baseUrl = 'http://localhost:5000/api/sleep';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getSleepEntries(): Observable<SleepEntry[]> {
    return this.http.get<SleepEntry[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getSleepEntry(id: string): Observable<SleepEntry> {
    return this.http.get<SleepEntry>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  createSleepEntry(data: Partial<SleepEntry>): Observable<SleepEntry> {
    return this.http.post<SleepEntry>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateSleepEntry(id: string, data: Partial<SleepEntry>): Observable<SleepEntry> {
    return this.http.put<SleepEntry>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteSleepEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
