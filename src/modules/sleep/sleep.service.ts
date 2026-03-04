import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SleepEntry } from './sleep.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SleepService {
private baseUrl = `${environment.apiUrl}/sleep`;

  constructor(private http: HttpClient) {}

  getSleepEntries(): Observable<SleepEntry[]> {
    return this.http.get<SleepEntry[]>(this.baseUrl,);
  }

  getSleepEntry(id: string): Observable<SleepEntry> {
    return this.http.get<SleepEntry>(`${this.baseUrl}/${id}`);
  }

  createSleepEntry(data: Partial<SleepEntry>): Observable<SleepEntry> {
    return this.http.post<SleepEntry>(this.baseUrl, data,);
  }

  updateSleepEntry(id: string, data: Partial<SleepEntry>): Observable<SleepEntry> {
    return this.http.put<SleepEntry>(`${this.baseUrl}/${id}`, data,);
  }

  deleteSleepEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`,);
  }
}
