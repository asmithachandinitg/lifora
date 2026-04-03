import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MoodService {

private base = `${environment.apiUrl}/mood`;

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
