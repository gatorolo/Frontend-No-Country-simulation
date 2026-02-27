import { Component, OnInit } from '@angular/core'; // Agregamos OnInit
import { NotificationService, Notification } from 'src/app/core/services/notification.service';
import Swal from 'sweetalert2';
import { MatchingService, ServicePost } from 'src/app/core/services/matching.service';
import { ServiceOrderService } from 'src/app/core/services/service-order.service';

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

    // REGISTRO DE GUARDIAS
    confirmedServices: ServicePost[] = [];

    stats = [
        { label: 'Acompañantes', value: '245', icon: 'groups', color: 'blue' },
        { label: 'Pacientes/Familia', value: '1,372', icon: 'elderly_woman', color: 'orange' },
        { label: 'Balance', value: '$105,265.75', icon: 'account_balance_wallet', color: 'green' }
    ];

    validationRequests: any[] = [];
    pendingPostulations: ServicePost[] = [];

    recentPayments = [
        { name: 'Marcos Andrada', amount: '$300.00', status: 'paid' },
        { name: 'José Tesuto', amount: '$45.00', status: 'paid' },
        { name: 'Aurora Rodriguez', amount: '$320.00', status: 'paid' },
        { name: 'Maria Aubeclasón', amount: '$-727.00', status: 'paid' }
    ];

    constructor(
        private notificationService: NotificationService,
        private matchingService: MatchingService,
        private serviceOrderService: ServiceOrderService
    ) { }

    ngOnInit(): void {

        this.notificationService.notifications$.subscribe(allNotifs => {

            this.notifications = allNotifs.filter(n => n.recipientRole === 'admin');

            this.unreadCount = this.notifications.filter(n => !n.read).length;

            console.log('📢 Admin: Notificaciones actualizadas', this.notifications);
        });


        this.matchingService.posts$.subscribe(allPosts => {
            this.confirmedServices = allPosts.filter(p => p.status === 'Confirmado');
            this.pendingPostulations = allPosts.filter(p => p.status === 'Postulado');
        });
    }

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

    handlePublishSuccess() {
        this.showPublishModal = false;
        Swal.fire({
            title: '¡Guardia Publicada!',
            text: 'La guardia ya está disponible para los cuidadores.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }

    handleCancelPublish() {
        Swal.fire({
            title: '¿Seguro que no quieres publicar?',
            text: 'Se perderán los datos no guardados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar',
            cancelButtonText: 'No, seguir editando',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#0891b2',
        }).then((result) => {
            if (result.isConfirmed) {
                this.showPublishModal = false;
            }
        });
    }

    approvePostulation(postId: number, caregiver: any) {
        this.matchingService.confirmCaregiver(postId).subscribe(() => {

            this.notificationService.addNotification({
                title: '¡Cuidador Asignado!',
                message: `Hemos asignado a ${caregiver.fullName} para tu servicio.`,
                type: 'success',
                recipientRole: 'family', // <--- VITAL
                relatedPostId: postId
            });

            Swal.fire('¡Éxito!', 'Cuidador asignado y familia notificada', 'success');
        });
    }

    /*confirmarAsignacion(postId: number, caregiver: any) {
        // 1. Llamamos al Backend para guardar en DB que la orden es "Confirmada" 
        // y que el cuidador es Mariano
        this.serviceOrderService.confirmOrder(postId, caregiver.id, caregiver.fullName).subscribe({
            next: (ordenActualizada) => {

                // 2. Si el backend respondió bien, mandamos la notificación local
                this.notificationService.addNotification({
                    title: '¡Cuidador Asignado!',
                    message: `${caregiver.fullName} ha sido asignado a la guardia.`,
                    recipientRole: 'family',
                    caregiverName: caregiver.fullName,
                    caregiverVerified: true,
                    relatedPostId: postId
                } as any);

                Swal.fire('¡Confirmado!', 'La familia ya puede ver al cuidador en su panel.', 'success');
            },
            error: (err) => {
                console.error('Error al confirmar en DB:', err);
                Swal.fire('Error', 'No se pudo guardar la confirmación', 'error');
            }
        });
    }

    confirmarAsignacion(postId: number, caregiver: any) {
        // 1. Verificación del ID (Priorizamos 'id' que es como está en Java)
        const idEncontrado = caregiver?.id || caregiver?.caregiverId;

        // 2. Verificación del Nombre (Priorizamos 'caregiverName' que es como está en tu Java)
        const nombreEncontrado = caregiver?.caregiverName ||
            caregiver?.name ||
            caregiver?.fullName ||
            'Cuidador';

        // Log de emergencia para ver qué está llegando realmente
        console.log('Datos recibidos en la función:', {
            objetoCompleto: caregiver,
            idDetectado: idEncontrado,
            nombreDetectado: nombreEncontrado
        });

        if (!idEncontrado) {
            Swal.fire('Error de Datos', 'El objeto del cuidador no tiene un ID válido.', 'error');
            return;
        }

        this.serviceOrderService.confirmOrder(postId, idEncontrado, nombreEncontrado).subscribe({
            next: (res) => {
                this.notificationService.addNotification({
                    title: '¡Cuidador Asignado!',
                    message: `${nombreEncontrado} ha sido asignado a la guardia.`,
                    recipientRole: 'family',
                    caregiverName: nombreEncontrado,
                    caregiverVerified: true,
                    relatedPostId: postId
                } as any);

                Swal.fire('¡Confirmado!', `Asignamos a ${nombreEncontrado}`, 'success');
            },
            error: (err) => {
                console.error('Error en la respuesta del servidor:', err);
                Swal.fire('Error', 'El servidor no pudo procesar la confirmación (400 Bad Request)', 'error');
            }
        });
    }*/
    confirmarAsignacion(postId: number, caregiver: any) {
        // Si 'caregiver.id' no existe, intentamos buscarlo en el post mismo
        const idEncontrado = caregiver?.id || caregiver?.caregiverId;
        const nombreEncontrado = caregiver?.caregiverName || caregiver?.name;

        if (!idEncontrado) {
            console.error("No se puede confirmar: El objeto no tiene ID", caregiver);
            Swal.fire('Error', 'No tenemos el ID del cuidador. Prueba recargar la página.', 'error');
            return;
        }

        // Usamos el nuevo método del servicio que sí pasa los parámetros
        this.matchingService.confirmOrder(postId, idEncontrado, nombreEncontrado).subscribe({
            next: (res) => {
                Swal.fire('¡Confirmado!', `Asignamos a ${nombreEncontrado}`, 'success');
            },
            error: (err) => console.error('Error 400 en Java:', err)
        });
    }

    deleteService(id: number, event: Event) {
        event.stopPropagation();
        Swal.fire({
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.matchingService.deletePost(id).subscribe({
                    next: () => Swal.fire('Eliminado', 'El registro ha sido borrado', 'success'),
                    error: (err) => Swal.fire('Error', 'No se pudo eliminar el registro', 'error')
                });
            }
        });
    }

    deleteValidationRequest(id: number, event: Event) {
        this.deleteService(id, event);
    }
}
