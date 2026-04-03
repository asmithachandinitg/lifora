import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
private base = `${environment.apiUrl}`;
  constructor(private http: HttpClient) { }

  getHabitSummary(): Observable<any> {
    return this.http.get(`${this.base}/habits`).pipe(catchError(() => of([])));
  }

  getFitnessSummary(): Observable<any> {
    return this.http.get(`${this.base}/fitness`).pipe(catchError(() => of([])));
  }

  getFoodSummary(): Observable<any> {
    return this.http.get(`${this.base}/food`).pipe(catchError(() => of([])));
  }

  getMoodSummary(): Observable<any> {
    return this.http.get(`${this.base}/mood`).pipe(catchError(() => of([])));
  }

  getTasksSummary(): Observable<any> {
    return this.http.get(`${this.base}/tasks`).pipe(catchError(() => of([])));
  }

  getGoalsSummary(): Observable<any> {
    return this.http.get(`${this.base}/goals`).pipe(catchError(() => of([])));
  }

  getDiarySummary(): Observable<any> {
    return this.http.get(`${this.base}/diary`).pipe(catchError(() => of([])));
  }
}