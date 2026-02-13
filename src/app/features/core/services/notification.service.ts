import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    date: Date;
    read: boolean;
    relatedPostId?: number; // Link to service post for click-through
    recipientRole?: 'admin' | 'caregiver' | 'family'; // Target role for filtering
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationsSource = new BehaviorSubject<Notification[]>([
        // Mock: Admin notifications (visible solo en dashboard admin)
        {
            id: 9001,
            title: 'Nueva Postulación Recibida',
            message: 'María González se ha postulado para el servicio de Roberto Sánchez (78 años).',
            type: 'success',
            date: new Date(Date.now() - 5 * 60000), // 5 min ago
            read: false,
            relatedPostId: 1,
            recipientRole: 'admin'
        },
        {
            id: 9002,
            title: 'Nueva Postulación Recibida',
            message: 'Carlos Pérez se ha postulado para el servicio de Ana Martínez (82 años).',
            type: 'success',
            date: new Date(Date.now() - 15 * 60000), // 15 min ago
            read: false,
            recipientRole: 'admin'
        },
        // Mock: Caregiver notifications (visible solo en caregiver dashboard)
        {
            id: 9003,
            title: 'Nuevo Servicio Disponible',
            message: 'Se busca Kinesiología para José Rodríguez (70 años) en Centro.',
            type: 'info',
            date: new Date(Date.now() - 10 * 60000), // 10 min ago
            read: false,
            relatedPostId: 2,
            recipientRole: 'caregiver'
        },
        {
            id: 9004,
            title: 'Servicio Confirmado',
            message: 'Has sido confirmado para el servicio de Roberto Sánchez.',
            type: 'success',
            date: new Date(Date.now() - 30 * 60000), // 30 min ago
            read: true,
            recipientRole: 'caregiver'
        },
        // Mock: Family notifications (visible solo en family dashboard)
        {
            id: 9005,
            title: 'Cuidador Asignado',
            message: 'María González ha sido asignada para el cuidado de Roberto Sánchez. Especialidad: Gerontología.',
            type: 'success',
            date: new Date(Date.now() - 20 * 60000), // 20 min ago
            read: false,
            recipientRole: 'family'
        },
        {
            id: 9006,
            title: 'Próxima Visita Programada',
            message: 'Recordatorio: La próxima visita de María González es mañana a las 10:00 AM.',
            type: 'info',
            date: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
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
