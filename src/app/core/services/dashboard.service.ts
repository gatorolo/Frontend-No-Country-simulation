import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private apiUrl = `${API_BASE_URL}/dashboard`;

    constructor(private http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }

    getRecentPayments(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/recent-payments`);
    }
}
