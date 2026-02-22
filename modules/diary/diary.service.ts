import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class DiaryService {

  private baseUrl =
    'http://localhost:5000/api/diary';

  constructor(
    private http: HttpClient
  ) {}

  createEntry(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  getEntries() {
    return this.http.get(this.baseUrl);
  }

  deleteEntry(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  updateEntry(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }
}
