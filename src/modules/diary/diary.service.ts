import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class DiaryService {

  private baseUrl = 'http://localhost:5000/api/diary';

  constructor(private http: HttpClient) {}

  createEntry(data: any) {
    return this.http.post(this.baseUrl, data);
  }

  getEntries() {
    return this.http.get(this.baseUrl);
  }

  // ── NEW: fetch diary entries linked to a specific trip ──
  getEntriesByTrip(tripId: string) {
    return this.http.get(`${this.baseUrl}?linkedTripId=${tripId}`);
  }

  deleteEntry(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  updateEntry(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }
}
