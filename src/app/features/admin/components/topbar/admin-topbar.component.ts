import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { ProfileService } from 'src/app/core/services/profile.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

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
    userName: string = 'Admin';
    userAvatar: string = 'assets/user-placeholder.png';

    constructor(
        private matchingService: MatchingService,
        private notificationService: NotificationService,
        private caregiverService: CaregiverService,
        private profileService: ProfileService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Suscripción al perfil del admin (avatar y nombre)
        this.profileService.userName$.subscribe(n => this.userName = n);
        this.profileService.userAvatar$.subscribe(a => this.userAvatar = a);

        // Suscripción a Notificaciones Reales vía NotificationService
        this.notificationService.notifications$.subscribe(allNotifs => {
            // Filtramos solo las que son para el ADMIN
            const adminNotifs = allNotifs.filter(n => n.recipientRole === 'admin');

            this.notifications = adminNotifs;
            this.unreadCount = adminNotifs.filter(n => !n.read).length;

            console.log('🔔 Admin notifications updated:', this.notifications);
        });

        // Mantenemos carga inicial de posts por si acaso
        this.matchingService.loadPosts().subscribe();
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0;
        }
    }

    selectedNotification: any = null;
    activeNotificationId: number | null = null;
    isPatientRequest: boolean = false;

    openNotificationDetail(notification: any) {
        this.activeNotificationId = notification.id;
        this.isPatientRequest = (notification.title === 'Nueva Solicitud de Servicio');

        // Buscamos el post real para alimentar el modal de aprobación si hay un ID relacionado
        if (notification.relatedPostId) {
            const posts = this.matchingService.getPosts();
            const postReal = posts.find(p => p.id === notification.relatedPostId);

            if (postReal) {
                this.selectedNotification = postReal;
            } else {
                // Si no está en la lista local, usamos la notificación pero nos aseguramos de que tenga los campos
                // Gracias a que ahora el cuidador envía metadatos, esto funcionará.
                this.selectedNotification = notification;
            }
        } else {
            this.selectedNotification = notification;
        }

        this.showNotifications = false;
        // Marcamos como leída al abrir el detalle
        this.notificationService.markAsRead(notification.id);
    }

    closeNotificationDetail() {
        this.selectedNotification = null;
    }

    goToDashboard() {
        this.closeNotificationDetail();
        this.router.navigate(['/admin']);
    }

    approveAssignment() {
        if (this.selectedNotification) {
            // Normalizar el ID del post (si es notificación usamos relatedPostId, si es post usamos id)
            const postId = this.selectedNotification.relatedPostId || this.selectedNotification.id;
            const patientName = this.selectedNotification.patientName || 'Paciente';
            const caregiverId = this.selectedNotification.caregiverId;
            const caregiverName = this.selectedNotification.caregiverName || 'Cuidador';

            this.matchingService.confirmOrder(postId, caregiverId, caregiverName).subscribe({
                next: () => console.log('✅ Guardia confirmada desde Topbar'),
                error: (err) => console.error('❌ Error al confirmar desde Topbar:', err)
            });

            // Actualizar estado de la notificación a Aprobado en DB
            if (this.activeNotificationId) {
                this.notificationService.updateNotificationStatus(this.activeNotificationId, 'Aprobado');
            }

            // Actualizar estado localmente para reflejar el cambio en la UI instantáneamente
            this.selectedNotification.status = 'Aprobado';

            // 1. Notificación al CUIDADOR
            this.notificationService.addNotification({
                title: '¡Postulación Aceptada!',
                message: `Tu postulación para el servicio de ${patientName} ha sido aceptada por el administrador.`,
                type: 'success',
                recipientRole: 'caregiver',
                relatedPostId: postId,
                status: 'Confirmado'
            } as any);

            // 2. Buscamos datos del cuidador para la familia
            if (caregiverId) {
                this.caregiverService.getCaregiverById(caregiverId).subscribe({
                    next: (cg) => {
                        // Mapeo robusto del nombre (el backend puede usar distintos campos)
                        const cgRealName = cg.fullName || cg.caregiverName || cg.name || 'Cuidador';
                        const cgSpecialty = cg.specialty || 'Acompañante Especializado';

                        // 3. Notificación a la FAMILIA con datos reales
                        this.notificationService.addNotification({
                            title: '¡Cuidador Asignado!',
                            message: `Se ha asignado a ${cgRealName} (${cgSpecialty}) para ${patientName}. Teléfono: ${cg.phone || 'N/A'}`,
                            type: 'success',
                            recipientRole: 'family',
                            relatedPostId: postId,
                            // Metadatos para actualización inmediata del UI
                            caregiverName: cgRealName,
                            caregiverSpecialty: cgSpecialty,
                            caregiverVerified: true
                        } as any);
                    },
                    error: (err) => {
                        console.error('Error al recuperar datos del cuidador', err);
                        // Fallback si falla la carga de datos del cuidador
                        this.notificationService.addNotification({
                            title: '¡Cuidador Asignado!',
                            message: `${caregiverName} ha sido confirmada para el cuidado de ${patientName}.`,
                            type: 'success',
                            recipientRole: 'family',
                            relatedPostId: postId,
                            caregiverName: caregiverName,
                            caregiverSpecialty: 'Acompañante Especiliazado',
                            caregiverVerified: true
                        } as any);
                    }
                });
            }

            Swal.fire({
                icon: 'success',
                title: '¡Has aprobado la asignación!',
                text: `de ${caregiverName} para ${patientName}`,
                confirmButtonText: 'Entendido'
            });
            this.closeNotificationDetail();
        }
    }

    clearNotifications() {
        this.notificationService.clearByRole('admin');
        this.showNotifications = false;
        console.log('🧹 Admin notifications cleared');
    }

}
