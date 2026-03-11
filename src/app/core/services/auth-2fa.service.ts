import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class Auth2FAService {
    private apiUrl = `${API_BASE_URL}/auth`;
    private readonly TOKEN_KEY = 'auth_token';

    constructor(private http: HttpClient) { }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    saveToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem('loggedUserName');
        localStorage.removeItem('loggedUserId');
    }

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
