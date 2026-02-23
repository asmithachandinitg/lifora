import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Goal } from './goals.model';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private baseUrl = 'http://localhost:5000/api/goals';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getGoal(id: string): Observable<Goal> {
    return this.http.get<Goal>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateGoal(id: string, data: Partial<Goal>): Observable<Goal> {
    return this.http.put<Goal>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  toggleMilestone(goalId: string, milestoneId: string): Observable<Goal> {
    return this.http.patch<Goal>(
      `${this.baseUrl}/${goalId}/milestones/${milestoneId}/toggle`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteGoal(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
