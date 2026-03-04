import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from './reading.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReadingService {
private baseUrl = `${environment.apiUrl}/reading`;

  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl);
  }

  createBook(data: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, data);
  }

  updateBook(id: string, data: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, data);
  }

  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
