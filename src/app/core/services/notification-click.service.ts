import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationClickService {
    private notificationClickSource = new Subject<number>();
    notificationClick$ = this.notificationClickSource.asObservable();

    emitNotificationClick(postId: number) {
        this.notificationClickSource.next(postId);
    }
}
