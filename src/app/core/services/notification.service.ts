import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    date: Date;
    read: boolean;
    relatedPostId?: number;
    recipientRole?: 'admin' | 'caregiver' | 'family';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private storageKey = 'valora_notifications';
    private notificationsSource = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notificationsSource.asObservable();

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convertimos strings de fecha a objetos Date
                const formatted = parsed.map((n: any) => ({
                    ...n,
                    date: new Date(n.date)
                }));
                this.notificationsSource.next(formatted);
            } catch (e) {
                console.error('Error parsing notifications from storage', e);
                this.setInitialMocks();
            }
        } else {
            this.setInitialMocks();
        }
    }

    private setInitialMocks() {
        const mocks: Notification[] = [
            {
                id: 9001,
                title: 'Nueva Postulación Recibida',
                message: 'María González se ha postulado para el servicio de Roberto Sánchez (78 años).',
                type: 'success',
                date: new Date(Date.now() - 5 * 60000),
                read: false,
                relatedPostId: 1,
                recipientRole: 'admin'
            },
            {
                id: 9002,
                title: 'Nueva Postulación Recibida',
                message: 'Carlos Pérez se ha postulado para el servicio de Ana Martínez (82 años).',
                type: 'success',
                date: new Date(Date.now() - 15 * 60000),
                read: false,
                recipientRole: 'admin'
            },
            {
                id: 9003,
                title: 'Nuevo Servicio Disponible',
                message: 'Se busca Kinesiología para José Rodríguez (70 años) en Centro.',
                type: 'info',
                date: new Date(Date.now() - 10 * 60000),
                read: false,
                relatedPostId: 2,
                recipientRole: 'caregiver'
            },
            {
                id: 9004,
                title: 'Servicio Confirmado',
                message: 'Has sido confirmado para el servicio de Roberto Sánchez.',
                type: 'success',
                date: new Date(Date.now() - 30 * 60000),
                read: true,
                recipientRole: 'caregiver'
            }
        ];
        this.saveAndNext(mocks);
    }

    private saveAndNext(notifications: Notification[]) {
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
        this.notificationsSource.next(notifications);
    }

    addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>) {
        const current = this.notificationsSource.getValue();
        const newNotif: Notification = {
            ...notification,
            id: Date.now(),
            date: new Date(),
            read: false
        };
        this.saveAndNext([newNotif, ...current]);
    }

    markAsRead(id: number) {
        const current = this.notificationsSource.getValue();
        const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
        this.saveAndNext(updated);
    }

    markAllAsReadByRole(role: 'admin' | 'caregiver' | 'family') {
        const current = this.notificationsSource.getValue();
        const updated = current.map(n => n.recipientRole === role ? { ...n, read: true } : n);
        this.saveAndNext(updated);
    }

    clearByRole(role: 'admin' | 'caregiver' | 'family') {
        const current = this.notificationsSource.getValue();
        const filtered = current.filter(n => n.recipientRole !== role);
        this.saveAndNext(filtered);
    }

    removeNotification(id: number) {
        const current = this.notificationsSource.getValue();
        this.saveAndNext(current.filter(n => n.id !== id));
    }

    clearAll() {
        this.saveAndNext([]);
    }
}
