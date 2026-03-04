import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Goal } from './goals.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private baseUrl = `${environment.apiUrl}/goals`;

  constructor(private http: HttpClient) { }

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.baseUrl);
  }

  getGoal(id: string): Observable<Goal> {
    return this.http.get<Goal>(`${this.baseUrl}/${id}`);
  }

  createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, data);
  }

  updateGoal(id: string, data: Partial<Goal>): Observable<Goal> {
    return this.http.put<Goal>(`${this.baseUrl}/${id}`, data);
  }

  toggleMilestone(goalId: string, milestoneId: string): Observable<Goal> {
    return this.http.patch<Goal>(
      `${this.baseUrl}/${goalId}/milestones/${milestoneId}/toggle`,
      {}
    );
  }

  deleteGoal(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
