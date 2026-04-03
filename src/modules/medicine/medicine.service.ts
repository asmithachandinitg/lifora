import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medicine, DoseLog } from './medicine.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicineService {
private baseUrl = `${environment.apiUrl}/medicine`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  // Medicines
  getMedicines(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(this.baseUrl, { headers: this.headers() });
  }

  createMedicine(data: Partial<Medicine>): Observable<Medicine> {
    return this.http.post<Medicine>(this.baseUrl, data, { headers: this.headers() });
  }

  updateMedicine(id: string, data: Partial<Medicine>): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.baseUrl}/${id}`, data, { headers: this.headers() });
  }

  deleteMedicine(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // Dose logs
  getDoseLogs(): Observable<DoseLog[]> {
    return this.http.get<DoseLog[]>(`${this.baseUrl}/logs`, { headers: this.headers() });
  }

  logDose(data: Partial<DoseLog>): Observable<DoseLog> {
    return this.http.post<DoseLog>(`${this.baseUrl}/logs`, data, { headers: this.headers() });
  }

  deleteDoseLog(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/logs/${id}`, { headers: this.headers() });
  }
}
