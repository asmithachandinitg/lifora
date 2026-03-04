import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodEntry } from './food.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FoodService {
private baseUrl = `${environment.apiUrl}/food`;

  constructor(private http: HttpClient) {}

  getFoodEntries(): Observable<FoodEntry[]> {
    return this.http.get<FoodEntry[]>(this.baseUrl);
  }

  createFoodEntry(data: Partial<FoodEntry>): Observable<FoodEntry> {
    return this.http.post<FoodEntry>(this.baseUrl, data);
  }

  updateFoodEntry(id: string, data: Partial<FoodEntry>): Observable<FoodEntry> {
    return this.http.put<FoodEntry>(`${this.baseUrl}/${id}`, data);
  }

  deleteFoodEntry(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
