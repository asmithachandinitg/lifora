import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodEntry } from './food.model';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private baseUrl = 'http://localhost:5000/api/food';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getFoodEntries(): Observable<FoodEntry[]> {
    return this.http.get<FoodEntry[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  createFoodEntry(data: Partial<FoodEntry>): Observable<FoodEntry> {
    return this.http.post<FoodEntry>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateFoodEntry(id: string, data: Partial<FoodEntry>): Observable<FoodEntry> {
    return this.http.put<FoodEntry>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteFoodEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
