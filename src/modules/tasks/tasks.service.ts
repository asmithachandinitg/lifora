import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
    _id?: string;
    title: string;
    description: string;
    dueDate: Date | null;
    priority: number;
    tags: string[];
    reminderEnabled: boolean;
    reminderTime: Date | null;
    status: 'pending' | 'in-progress' | 'completed';
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {

private apiUrl = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    getTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl);
    }

    createTask(task: Task): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task);
    }

    deleteTask(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    updateTask(id: string, data: any) {
        return this.http.put<any>(`${this.apiUrl}/${id}`, data);
    }

    getTags() {
        return this.http.get<string[]>(`${this.apiUrl}/tags`);
    }

    createTag(name: string) {
        return this.http.post<any>(`${this.apiUrl}/tags`, { name });
    }

}