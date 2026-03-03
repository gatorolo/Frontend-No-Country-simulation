import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private apiUrl = `${API_BASE_URL}/registrations`;

    constructor(private http: HttpClient) { }

    getPendingRequests(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/pending`);
    }

    approveRequest(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/approve`, {});
    }

    rejectRequest(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/reject`, {});
    }
}
