import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class Auth2FAService {
    private apiUrl = `${API_BASE_URL}/auth`;

    constructor(private http: HttpClient) { }

    setup2FA(username: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/setup-2fa?username=${username}`, {});
    }

    verify2FA(username: string, code: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/verify-2fa`, { username, code });
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials);
    }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user);
    }
}
