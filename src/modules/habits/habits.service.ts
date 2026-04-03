import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Habit, HabitCompletion } from './habits.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HabitService {
private base = `${environment.apiUrl}/habits`;

  constructor(private http: HttpClient) {}

  getHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(this.base);
  }

  createHabit(data: Partial<Habit>): Observable<Habit> {
    return this.http.post<Habit>(this.base, data);
  }

  updateHabit(id: string, data: Partial<Habit>): Observable<Habit> {
    return this.http.put<Habit>(`${this.base}/${id}`, data);
  }

  deleteHabit(id: string): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  toggleLog(id: string, date: string, completed: boolean, note?: string): Observable<Habit> {
    return this.http.post<Habit>(`${this.base}/${id}/log`, { date, completed, note });
  }
}