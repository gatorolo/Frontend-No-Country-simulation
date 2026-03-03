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

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${API_BASE_URL}/notifications`;
    private notificationsSource = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notificationsSource.asObservable();

    // Notifier Audio Support
    private notificationAudio = new Audio('assets/ding-dong.mp3');
    private previousUnreadCount = 0;
    private firstLoadComplete = false;

    constructor(private http: HttpClient) {
        this.loadFromApi();
        // Polling para mantener notificaciones sincronizadas desde la base de datos
        interval(15000).subscribe(() => {
            this.loadFromApi();
        });
    }

    private loadFromApi() {
        // Añadimos un timestamp para evitar que el navegador (Chrome/Edge) guarde en caché la respuesta
        // y vuelva a mostrar notificaciones que ya fueron eliminadas de la base de datos.
        const noCacheUrl = `${this.apiUrl}?t=${new Date().getTime()}`;
        this.http.get<Notification[]>(noCacheUrl).subscribe({
            next: (data) => {
                // MySQL devuelve las fechas en strings, las convertimos a objetos Date
                const formatted = data.map((n: any) => ({
                    ...n,
                    date: new Date(n.date)
                }));
                this.notificationsSource.next(formatted);

                // Notification Sound Logic
                const currentUnreadCount = formatted.filter(n => !n.read).length;

                // Si hay más notificaciones no leídas ahora que en la recarga anterior,
                // y no estamos en la primera carga (para evitar sonar al abrir la página)...
                if (this.firstLoadComplete && currentUnreadCount > this.previousUnreadCount) {
                    this.notificationAudio.play().catch(e => {
                        console.warn('El navegador bloqueó el autoplay del sonido de la notificación. El usuario debe interactuar con la web primero.', e);
                    });
                }

                this.previousUnreadCount = currentUnreadCount;
                this.firstLoadComplete = true;
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
        // Enviar actualización de estado al nuevo endpoint del backend
        this.http.put(`${this.apiUrl}/${id}/status`, { status }).subscribe({
            next: () => {
                console.log(`✅ Estado de notificación ${id} actualizado a ${status}`);
                this.loadFromApi();
            },
            error: (err) => console.error('❌ Error al actualizar estado de notificación', err)
        });
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