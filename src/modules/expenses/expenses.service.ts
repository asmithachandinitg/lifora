import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

private base = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  // Expenses
  getExpenses(): Observable<any[]> {
    return this.http.get<any[]>(this.base, this.headers());
  }
createExpense(data: any): Observable<{ expense: any; budgetAlert: any }> {
  return this.http.post<{ expense: any; budgetAlert: any }>(this.base, data, this.headers());
}
  updateExpense(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, data, this.headers());
  }
  deleteExpense(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`, this.headers());
  }

  // Accounts
  getAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/accounts`, this.headers());
  }
  createAccount(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/accounts`, data, this.headers());
  }
  updateAccount(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/accounts/${id}`, data, this.headers());
  }
  deleteAccount(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/accounts/${id}`, this.headers());
  }

  // Budgets
  getBudgets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/budgets`, this.headers());
  }
  setBudget(categoryId: string, limit: number): Observable<any> {
    return this.http.post<any>(`${this.base}/budgets`, { categoryId, limit }, this.headers());
  }
  deleteBudget(categoryId: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/budgets/${categoryId}`, this.headers());
  }

  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/categories`, this.headers());
  }
  createCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/categories`, data, this.headers());
  }
  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/categories/${id}`, data, this.headers());
  }
  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/categories/${id}`, this.headers());
  }
  getBudgetStatus(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/budgets/status`, this.headers());
}


}
