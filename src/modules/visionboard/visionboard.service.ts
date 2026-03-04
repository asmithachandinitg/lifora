// src/modules/visionboard/visionboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisionItem } from './visionboard.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisionboardService {
  private baseUrl = `${environment.apiUrl}/visionboard`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisionItem[]> {
    return this.http.get<VisionItem[]>(this.baseUrl);
  }

  create(data: Partial<VisionItem>): Observable<VisionItem> {
    return this.http.post<VisionItem>(this.baseUrl, data);
  }

  update(id: string, data: Partial<VisionItem>): Observable<VisionItem> {
    return this.http.put<VisionItem>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  markAchieved(id: string): Observable<VisionItem> {
    return this.http.patch<VisionItem>(`${this.baseUrl}/${id}/achieved`, {});
  }
}
