// src/modules/knowledge/knowledge.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KnowledgeEntry } from './knowledge.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private baseUrl = `${environment.apiUrl}/knowledge`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<KnowledgeEntry[]> {
    return this.http.get<KnowledgeEntry[]>(this.baseUrl);
  }

  create(data: Partial<KnowledgeEntry>): Observable<KnowledgeEntry> {
    return this.http.post<KnowledgeEntry>(this.baseUrl, data);
  }

  update(id: string, data: Partial<KnowledgeEntry>): Observable<KnowledgeEntry> {
    return this.http.put<KnowledgeEntry>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
