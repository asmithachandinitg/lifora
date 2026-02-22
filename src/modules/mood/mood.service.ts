import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoodService {

  private base = 'http://localhost:5000/api/mood';

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  getMoods(): Observable<any[]> {
    return this.http.get<any[]>(this.base, this.headers());
  }

  createMood(data: any): Observable<any> {
    return this.http.post<any>(this.base, data, this.headers());
  }

  deleteMood(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`, this.headers());
  }
}
