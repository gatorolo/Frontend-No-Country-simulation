import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private userNameSource = new BehaviorSubject<string>(this.getStoredUserName());
    private userAvatarSource = new BehaviorSubject<string>(this.getStoredUserAvatar());
    private userIdSource = new BehaviorSubject<number>(this.getStoredUserId());

    userName$ = this.userNameSource.asObservable();
    userAvatar$ = this.userAvatarSource.asObservable();
    userId$ = this.userIdSource.asObservable();

    constructor() { }

    private getStoredUserName(): string {
        return localStorage.getItem('loggedUserName') || 'Usuario Valora';
    }

    private getStoredUserAvatar(): string {
        return localStorage.getItem('userAvatar') || 'assets/user-placeholder.png';
    }

    private getStoredUserId(): number {
        const stored = localStorage.getItem('loggedUserId');
        return stored ? parseInt(stored, 10) : 1; // Default to 1 for backwards compatibility
    }

    setUserName(name: string) {
        localStorage.setItem('loggedUserName', name);
        this.userNameSource.next(name);
    }

    setUserId(id: number) {
        localStorage.setItem('loggedUserId', id.toString());
        this.userIdSource.next(id);
    }

    getUserId(): number {
        return this.userIdSource.getValue();
    }

    setUserAvatar(base64Image: string) {
        localStorage.setItem('userAvatar', base64Image);
        this.userAvatarSource.next(base64Image);
    }
}
