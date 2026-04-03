import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PeriodEntry, DailySymptomLog } from './period.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PeriodService {

  private base = `${environment.apiUrl}/period`;
  private dailyBase = `${environment.apiUrl}/daily-symptoms`;
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  getPeriodEntries(): Observable<PeriodEntry[]> {
    return this.http.get<PeriodEntry[]>(this.base, { headers: this.headers() });
  }
  createPeriodEntry(data: Partial<PeriodEntry>): Observable<PeriodEntry> {
    return this.http.post<PeriodEntry>(this.base, data, { headers: this.headers() });
  }
  updatePeriodEntry(id: string, data: Partial<PeriodEntry>): Observable<PeriodEntry> {
    return this.http.put<PeriodEntry>(`${this.base}/${id}`, data, { headers: this.headers() });
  }
  deletePeriodEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`, { headers: this.headers() });
  }

  // Daily symptom logs
  getDailyLogs(): Observable<DailySymptomLog[]> {
    return this.http.get<DailySymptomLog[]>(this.dailyBase, { headers: this.headers() });
  }
  createDailyLog(data: Partial<DailySymptomLog>): Observable<DailySymptomLog> {
    return this.http.post<DailySymptomLog>(this.dailyBase, data, { headers: this.headers() });
  }
  updateDailyLog(id: string, data: Partial<DailySymptomLog>): Observable<DailySymptomLog> {
    return this.http.put<DailySymptomLog>(`${this.dailyBase}/${id}`, data, { headers: this.headers() });
  }
  deleteDailyLog(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.dailyBase}/${id}`, { headers: this.headers() });
  }
}
