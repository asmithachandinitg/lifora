import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkoutEntry, PersonalRecord } from './fitness.model';

@Injectable({ providedIn: 'root' })
export class FitnessService {
  private baseUrl = 'http://localhost:5000/api/fitness';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getWorkouts(): Observable<WorkoutEntry[]> {
    return this.http.get<WorkoutEntry[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getPersonalRecords(): Observable<PersonalRecord[]> {
    return this.http.get<PersonalRecord[]>(`${this.baseUrl}/records`, { headers: this.getHeaders() });
  }

  createWorkout(data: Partial<WorkoutEntry>): Observable<WorkoutEntry> {
    return this.http.post<WorkoutEntry>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateWorkout(id: string, data: Partial<WorkoutEntry>): Observable<WorkoutEntry> {
    return this.http.put<WorkoutEntry>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteWorkout(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
