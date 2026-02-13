import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatchingService } from 'src/app/core/services/matching.service';

@Component({
    selector: 'app-admin-topbar',
    templateUrl: './admin-topbar.component.html',
    styleUrls: ['./admin-topbar.component.css']
})
export class AdminTopbarComponent implements OnInit {

    @Output() menuClick = new EventEmitter<void>();

    notifications: any[] = [];
    unreadCount = 0;
    showNotifications = false;

    constructor(private matchingService: MatchingService) { }

    ngOnInit(): void {
        this.matchingService.posts$.subscribe(posts => {
            // Admin interested in 'Postulado' status (applications)
            const applications = posts.filter(p => p.status === 'Postulado');

            if (applications.length > this.notifications.length) {
                const countDiff = applications.length - this.notifications.length;
                if (countDiff > 0) {
                    this.unreadCount += countDiff;
                }
                this.notifications = applications;
            } else {
                this.notifications = applications;
            }
        });
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0;
        }
    }

    selectedNotification: any = null;

    openNotificationDetail(notification: any) {
        this.selectedNotification = notification;
        this.showNotifications = false;
    }

    closeNotificationDetail() {
        this.selectedNotification = null;
    }

    approveAssignment() {
        if (this.selectedNotification) {
            this.matchingService.confirmPost(this.selectedNotification.id);
            alert(`Has aprobado la asignación de ${this.selectedNotification.caregiverName} para ${this.selectedNotification.patientName}`);
            this.closeNotificationDetail();

            // Refresh logic if needed, or rely on subscription update
        }
    }

}
