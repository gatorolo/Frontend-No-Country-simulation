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
    status?: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Completado';
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
        // Sincronización entre pestañas
        window.addEventListener('storage', (event) => {
            if (event.key === this.storageKey) {
                this.loadFromStorage();
            }
        });
    }

    private loadFromStorage() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const formatted = parsed.map((n: any) => ({
                    ...n,
                    date: new Date(n.date)
                }));
                this.notificationsSource.next(formatted);
            } catch (e) {
                console.error('Error al cargar notificaciones:', e);
                this.notificationsSource.next([]);
            }
        } else {
            this.notificationsSource.next([]); // Empezamos vacío si no hay nada guardado
        }
    }

    private saveAndNext(notifications: Notification[]) {
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
        this.notificationsSource.next(notifications);
    }

    // ESTE ES EL MÉTODO QUE USAREMOS PARA CREAR NOTIFICACIONES NUEVAS
    addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>) {
        const current = this.notificationsSource.getValue();
        const newNotif: Notification = {
            status: 'Pendiente', // Default
            ...notification,
            id: Date.now(),
            date: new Date(),
            read: false
        } as Notification;
        // Las nuevas aparecen primero (unshift)
        this.saveAndNext([newNotif, ...current]);
    }

    updateNotificationStatus(id: number, status: Notification['status']) {
        const current = this.notificationsSource.getValue();
        const updated = current.map(n => n.id === id ? { ...n, status } : n);
        this.saveAndNext(updated);
    }

    markAsRead(id: number) {
        const current = this.notificationsSource.getValue();
        const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
        this.saveAndNext(updated);
    }

    // Limpia las notificaciones por rol (ej: al vaciar la papelera)
    clearByRole(role: 'admin' | 'caregiver' | 'family') {
        const current = this.notificationsSource.getValue();
        const filtered = current.filter(n => n.recipientRole !== role);
        this.saveAndNext(filtered);
    }

    removeNotification(id: number) {
        const current = this.notificationsSource.getValue();
        this.saveAndNext(current.filter(n => n.id !== id));
    }
}