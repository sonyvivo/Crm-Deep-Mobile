import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    token?: string;
    user?: { id: number; username: string };
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Auth
    login(username: string, password: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/login`, { username, password });
    }

    register(username: string, password: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/register`, { username, password });
    }

    verifyToken(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.baseUrl}/auth/verify`);
    }

    // Generic CRUD methods
    getAll<T>(endpoint: string): Observable<T[]> {
        return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}/${endpoint}`)
            .pipe(map(res => res.data || []));
    }

    getOne<T>(endpoint: string, id: string): Observable<T> {
        return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`)
            .pipe(map(res => res.data as T));
    }

    create<T>(endpoint: string, data: T): Observable<T> {
        return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data)
            .pipe(map(res => res.data as T));
    }

    update<T>(endpoint: string, id: string, data: T): Observable<T> {
        return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`, data)
            .pipe(map(res => res.data as T));
    }

    delete(endpoint: string, id: string): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${endpoint}/${id}`);
    }

    // Specific endpoints
    getCustomers() { return this.getAll<any>('customers'); }
    getSuppliers() { return this.getAll<string>('suppliers'); }
    getPurchases() { return this.getAll<any>('purchases'); }
    getSales() { return this.getAll<any>('sales'); }
    getExpenses() { return this.getAll<any>('expenses'); }
    getJobSheets() { return this.getAll<any>('jobsheets'); }
    getInvoices() { return this.getAll<any>('invoices'); }
}
