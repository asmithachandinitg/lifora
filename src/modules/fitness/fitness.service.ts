import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkoutEntry, PersonalRecord } from './fitness.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FitnessService {
  private baseUrl = `${environment.apiUrl}/fitness`;

  constructor(private http: HttpClient) {}

  getWorkouts(): Observable<WorkoutEntry[]> {
    return this.http.get<WorkoutEntry[]>(this.baseUrl);
  }

  getPersonalRecords(): Observable<PersonalRecord[]> {
    return this.http.get<PersonalRecord[]>(`${this.baseUrl}/records`);
  }

  createWorkout(data: Partial<WorkoutEntry>): Observable<WorkoutEntry> {
    return this.http.post<WorkoutEntry>(this.baseUrl, data);
  }

  updateWorkout(id: string, data: Partial<WorkoutEntry>): Observable<WorkoutEntry> {
    return this.http.put<WorkoutEntry>(`${this.baseUrl}/${id}`, data);
  }

  deleteWorkout(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
