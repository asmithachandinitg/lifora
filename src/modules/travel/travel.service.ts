import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from './travel.model';

@Injectable({ providedIn: 'root' })
export class TravelService {
  private baseUrl = 'http://localhost:5000/api/travel';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl, { headers: this.headers() });
  }

  getTrip(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  createTrip(data: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, data, { headers: this.headers() });
  }

  updateTrip(id: string, data: Partial<Trip>): Observable<Trip> {
    return this.http.put<Trip>(`${this.baseUrl}/${id}`, data, { headers: this.headers() });
  }

  deleteTrip(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // ── Trip expense endpoints (synced to Finance module) ─────────

  addTripExpense(tripId: string, expense: {
    title: string; amount: number; category: string; date: string;
  }): Observable<{ trip: Trip; linkedExpenseId: string }> {
    return this.http.post<{ trip: Trip; linkedExpenseId: string }>(
      `${this.baseUrl}/${tripId}/expenses`,
      expense,
      { headers: this.headers() }
    );
  }

  deleteTripExpense(tripId: string, expId: string): Observable<{ trip: Trip }> {
    return this.http.delete<{ trip: Trip }>(
      `${this.baseUrl}/${tripId}/expenses/${expId}`,
      { headers: this.headers() }
    );
  }
}
