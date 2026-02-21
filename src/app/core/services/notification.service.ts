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
    private notificationsSource = new BehaviorSubject<Notification[]>([

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
        },

        {
            id: 9005,
            title: 'Cuidador Asignado',
            message: 'María González ha sido asignada para el cuidado de Roberto Sánchez. Especialidad: Gerontología.',
            type: 'success',
            date: new Date(Date.now() - 20 * 60000),
            read: false,
            recipientRole: 'family'
        },
        {
            id: 9006,
            title: 'Próxima Visita Programada',
            message: 'Recordatorio: La próxima visita de María González es mañana a las 10:00 AM.',
            type: 'info',
            date: new Date(Date.now() - 2 * 60 * 60000),
            read: true,
            recipientRole: 'family'
        }
    ]);
    notifications$ = this.notificationsSource.asObservable();

    addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>) {
        const current = this.notificationsSource.getValue();
        const newNotif: Notification = {
            ...notification,
            id: Date.now(),
            date: new Date(),
            read: false
        };
        this.notificationsSource.next([newNotif, ...current]);
    }

    markAsRead(id: number) {
        const current = this.notificationsSource.getValue();
        const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
        this.notificationsSource.next(updated);
    }

    removeNotification(id: number) {
        const current = this.notificationsSource.getValue();
        this.notificationsSource.next(current.filter(n => n.id !== id));
    }

    clearAll() {
        this.notificationsSource.next([]);
    }
}
