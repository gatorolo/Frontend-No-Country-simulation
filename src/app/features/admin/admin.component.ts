import { Component, OnInit } from '@angular/core'; // Agregamos OnInit
import { NotificationService , Notification } from 'src/app/core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit { // Implementamos OnInit
    
    // VARIABLES PARA LAS NOTIFICACIONES
    notifications: Notification[] = [];
    unreadCount: number = 0;
    showNotifications: boolean = false;

    stats = [
        { label: 'Acompañantes', value: '245', icon: 'groups', color: 'blue' },
        { label: 'Pacientes/Familia', value: '1,372', icon: 'elderly_woman', color: 'orange' },
        { label: 'Balance', value: '$105,265.75', icon: 'account_balance_wallet', color: 'green' }
    ];

    validationRequests = [
        { name: 'Nelson Gutiérrez', doc: 'Partición Geppert', type: 'Chofer hábitat', value: '$200.00', status: 'pending' },
        { name: 'Ana Martínez', doc: 'Mellouse Corntines', type: 'Gastos sistems', value: '$100.00', status: 'approved' },
        { name: 'José Pérez', doc: 'Martines Gamez', type: 'Gastos lopot', value: '$300.00', status: 'pending' }
    ];

    recentPayments = [
        { name: 'Marcos Andrada', amount: '$300.00', status: 'paid' },
        { name: 'José Tesuto', amount: '$45.00', status: 'paid' },
        { name: 'Aurora Rodriguez', amount: '$320.00', status: 'paid' },
        { name: 'Maria Aubeclasón', amount: '$-727.00', status: 'paid' }
    ];

    constructor(private notificationService: NotificationService) {} // Inyectamos el servicio

    ngOnInit(): void {
        // ESCUCHAR LAS NOTIFICACIONES
        this.notificationService.notifications$.subscribe(allNotifs => {
            // Filtramos solo las que son para el ADMIN
            this.notifications = allNotifs.filter(n => n.recipientRole === 'admin');
            
            // Contamos las no leídas
            this.unreadCount = this.notifications.filter(n => !n.read).length;
            
            console.log('📢 Admin: Notificaciones actualizadas', this.notifications);
        });
    }

    // MÉTODOS PARA LA INTERFAZ
    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
    }

    clearAllNotifications() {
        this.notificationService.clearByRole('admin');
    }

    removeNotification(event: Event, id: number) {
        event.stopPropagation();
        this.notificationService.removeNotification(id);
    }

    showPublishModal = false;

    openPublishModal() {
        this.showPublishModal = true;
    }

    closePublishModal() {
        this.showPublishModal = false;
        Swal.fire({

            title: 'Publicar Nueva Guardia?',
            icon: 'question',
            background: '#f7f9fc',
            color: '#04d5f5ff',
            cancelButtonColor: "#d33",
            confirmButtonColor: '#0891b2',
        });
    }
}
