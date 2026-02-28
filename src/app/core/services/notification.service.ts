import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    date: Date;
    read: boolean;
    relatedPostId?: number;
    recipientRole?: 'admin' | 'caregiver' | 'family';
    status?: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Completado';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = 'http://localhost:8080/api/notifications';
    private notificationsSource = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notificationsSource.asObservable();

    constructor(private http: HttpClient) {
        this.loadFromApi();
        // Polling para mantener notificaciones sincronizadas desde la base de datos
        interval(15000).subscribe(() => {
            this.loadFromApi();
        });
    }

    private loadFromApi() {
        this.http.get<Notification[]>(this.apiUrl).subscribe({
            next: (data) => {
                // MySQL devuelve las fechas en strings, las convertimos a objetos Date
                const formatted = data.map((n: any) => ({
                    ...n,
                    date: new Date(n.date)
                }));
                this.notificationsSource.next(formatted);
            },
            error: (err) => console.error('Error al cargar notificaciones desde DB', err)
        });
    }

    addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>) {
        // Para enviar a la BD:
        const payload = {
            ...notification,
            status: notification.status || 'Pendiente'
        };
        this.http.post<Notification>(this.apiUrl, payload).subscribe(() => {
            this.loadFromApi();
        });
    }

    updateNotificationStatus(id: number, status: Notification['status']) {
        // No hay endpoint creado para actualizar el "estado" de una notificación aún, 
        // pero podemos crear uno en Java o dejarlo pendiente:
        console.warn('updateNotificationStatus aún no implementado en el Controller Java.');
    }

    markAsRead(id: number) {
        this.http.put(`${this.apiUrl}/${id}/read`, {}).subscribe(() => {
            this.loadFromApi();
        });
    }

    clearByRole(role: 'admin' | 'caregiver' | 'family') {
        this.http.delete(`${this.apiUrl}/role/${role}`).subscribe(() => {
            this.loadFromApi();
        });
    }

    removeNotification(id: number) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
            this.loadFromApi();
        });
    }
}