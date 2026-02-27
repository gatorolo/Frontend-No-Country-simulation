import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private userNameSource = new BehaviorSubject<string>(this.getStoredUserName());
    private userAvatarSource = new BehaviorSubject<string>(this.getStoredUserAvatar());

    userName$ = this.userNameSource.asObservable();
    userAvatar$ = this.userAvatarSource.asObservable();

    constructor() { }

    private getStoredUserName(): string {
        return localStorage.getItem('loggedUserName') || 'Usuario Valora';
    }

    private getStoredUserAvatar(): string {
        return localStorage.getItem('userAvatar') || 'assets/user-placeholder.png';
    }

    setUserName(name: string) {
        localStorage.setItem('loggedUserName', name);
        this.userNameSource.next(name);
    }

    setUserAvatar(base64Image: string) {
        localStorage.setItem('userAvatar', base64Image);
        this.userAvatarSource.next(base64Image);
    }
}
