import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private apiUrl = 'http://localhost:8080/api/registrations';

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
