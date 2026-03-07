import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private apiUrl = `${API_BASE_URL}/reports`;

    constructor(private http: HttpClient) { }

    getShiftsHistory(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/shifts-history`);
    }

    clearAllHistory(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/clear-all`);
    }
}
