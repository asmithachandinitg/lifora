import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from './reading.model';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private baseUrl = 'http://localhost:5000/api/reading';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  createBook(data: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, data, { headers: this.getHeaders() });
  }

  updateBook(id: string, data: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
