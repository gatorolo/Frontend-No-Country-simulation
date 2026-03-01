import { Component, OnInit } from '@angular/core'; // Agregamos OnInit
import { NotificationService, Notification } from 'src/app/core/services/notification.service';
import Swal from 'sweetalert2';
import { MatchingService, ServicePost } from 'src/app/core/services/matching.service';
import { ServiceOrderService } from 'src/app/core/services/service-order.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { DashboardService } from 'src/app/core/services/dashboard.service';

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

    stats: any[] = [];

    validationRequests: any[] = [];
    pendingPostulations: ServicePost[] = [];
    pendingPatientRequests: ServicePost[] = [];

    recentPayments: any[] = [];

    constructor(
        private notificationService: NotificationService,
        private matchingService: MatchingService,
        private serviceOrderService: ServiceOrderService,
        private caregiverService: CaregiverService,
        private dashboardService: DashboardService
    ) { }

    activeShifts: any[] = [];
    unpaidSummary: any[] = [];
    patientUnpaidSummary: any[] = []; // NUEVO: Resumen de deuda de pacientes
    private pollInterval: any;
    private timerInterval: any;

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

        // NUEVO: Cargar solicitudes pendientes de pacientes
        this.loadPendingRequests();

        this.dashboardService.getStats().subscribe(data => {
            this.stats = [
                { label: 'Acompañantes', value: data.totalCaregivers.toString(), icon: 'groups', color: 'blue' },
                { label: 'Pacientes/Familia', value: data.totalPatients.toString(), icon: 'elderly_woman', color: 'orange' },
                { label: 'Balance', value: `$${data.totalBalance.toLocaleString('es-AR')}`, icon: 'account_balance_wallet', color: 'green' }
            ];
        });

        this.dashboardService.getRecentPayments().subscribe((data) => {
            this.recentPayments = data.map(payment => ({
                name: `Guardia #${payment.id} / $${payment.earned}`, // Simulating the payment description
                amount: `+ $${payment.earned}`,
                status: 'paid'
            }));
        });

        this.loadActiveShifts();
        this.loadUnpaidShifts();
        this.loadPatientUnpaidShifts();

        // Polling para traer guardias activas cada 10 segundos
        this.pollInterval = setInterval(() => {
            this.loadActiveShifts();
            this.loadPatientUnpaidShifts();
        }, 10000);

        // Timer local para actualizar el reloj en pantalla cada segundo sin llamar al back
        this.timerInterval = setInterval(() => {
            this.updateShiftTimers();
        }, 1000);
    }

    ngOnDestroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    // --- NUEVA LÓGICA DE GUARDIAS Y PAGOS ---

    loadActiveShifts() {
        this.caregiverService.getAllCaregivers().subscribe(caregivers => {
            const caregiverMap = new Map<number, string>();
            caregivers.forEach(c => caregiverMap.set(c.id!, c.caregiverName || c.fullName || 'Cuidador ' + c.id));

            this.caregiverService.getActiveShifts().subscribe({
                next: (shifts) => {
                    // Al recibir del back, calculamos los segundos que pasaron
                    this.activeShifts = shifts.map(shift => {
                        const start = new Date(shift.startTime).getTime();
                        const now = new Date().getTime();
                        const diffSeconds = Math.floor((now - start) / 1000);

                        return {
                            ...shift,
                            caregiverName: caregiverMap.get(shift.caregiverId) || ('Cuidador ID: ' + shift.caregiverId),
                            runningSeconds: diffSeconds,
                            displayTimer: this.formatTime(diffSeconds)
                        };
                    });
                },
                error: (err) => console.error('Error cargando guardias activas', err)
            });
        });
    }

    forceStopShift(caregiverId: number, seconds: number, event: Event) {
        event.stopPropagation();
        Swal.fire({
            title: '¿Forzar fin de guardia?',
            text: 'Se detendrá el reloj y se calculará el pago para el cuidador.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, finalizar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                this.caregiverService.stopShift({ caregiverId, durationSeconds: seconds }).subscribe({
                    next: () => {
                        Swal.fire('¡Finalizada!', 'La guardia ha sido cerrada mediante el administrador.', 'success');
                        this.loadActiveShifts();
                        this.loadUnpaidShifts();
                        this.loadPatientUnpaidShifts();
                    },
                    error: (err) => {
                        console.error('Error al forzar fin de guardia', err);
                        Swal.fire('Error', 'No se pudo finalizar la guardia', 'error');
                    }
                });
            }
        });
    }

    updateShiftTimers() {
        for (let shift of this.activeShifts) {
            shift.runningSeconds++;
            shift.displayTimer = this.formatTime(shift.runningSeconds);
        }
    }

    loadUnpaidShifts() {
        this.caregiverService.getAllCaregivers().subscribe(caregivers => {
            const caregiverMap = new Map<number, string>();
            caregivers.forEach(c => caregiverMap.set(c.id!, c.caregiverName || c.fullName || 'Cuidador ' + c.id));

            this.caregiverService.getUnpaidShifts().subscribe({
                next: (shifts) => {
                    // Agrupamos por cuidador para el resumen
                    const grouped = new Map<number, any>();

                    for (let s of shifts) {
                        if (!caregiverMap.has(s.caregiverId)) {
                            continue; // Ignore orphaned shifts
                        }

                        if (!grouped.has(s.caregiverId)) {
                            grouped.set(s.caregiverId, {
                                caregiverId: s.caregiverId,
                                caregiverName: caregiverMap.get(s.caregiverId) || ('Cuidador ' + s.caregiverId),
                                totalEarned: 0,
                                shiftIds: []
                            });
                        }
                        grouped.get(s.caregiverId).totalEarned += s.earned || 0;
                        grouped.get(s.caregiverId).shiftIds.push(s.id);
                    }

                    this.unpaidSummary = Array.from(grouped.values());
                },
                error: (err) => console.error('Error cargando guardias impagas', err)
            });
        });
    }

    payCaregiver(caregiverId: number, shiftIds: number[]) {
        Swal.fire({
            title: '¿Confirmar Pago?',
            text: 'Pasarás este saldo a PAGADO. Más adelante aquí se integrará MercadoPago.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Marcar como Pagado',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                // Por cada shift ID pendiente de este cuidador, llamamos a payShift
                let processed = 0;
                shiftIds.forEach(id => {
                    this.caregiverService.payShift(id).subscribe(() => {
                        processed++;
                        if (processed === shiftIds.length) {
                            Swal.fire('¡Pagado!', 'Se ha liquidado el monto del cuidador.', 'success');
                            this.loadUnpaidShifts(); // Refresco local
                        }
                    });
                });
            }
        });
    }

    // --- NUEVO: lógica para facturación de pacientes ---

    loadPatientUnpaidShifts() {
        this.caregiverService.getPatientUnpaidShifts().subscribe({
            next: (shifts) => {
                const grouped = new Map<string, any>();

                for (let s of shifts) {
                    if (!grouped.has(s.patientName)) {
                        grouped.set(s.patientName, {
                            patientName: s.patientName,
                            totalDebt: 0,
                            shiftIds: []
                        });
                    }
                    const group = grouped.get(s.patientName);
                    // Suponemos que el costo del paciente es el mismo 'earned' del cuidador
                    // Si tienes otra columna 'cost', reemplázala aquí
                    group.totalDebt += (s.earned || 0);
                    group.shiftIds.push(s.id);
                }

                this.patientUnpaidSummary = Array.from(grouped.values()).filter((g: any) => g.totalDebt > 0);
            },
            error: (err) => console.error('Error cargando deudas de pacientes', err)
        });
    }

    payPatient(patientName: string, shiftIds: number[]) {
        Swal.fire({
            title: '¿Registrar Cobro?',
            text: `Vas a registrar el cobro de la deuda de ${patientName}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                let processed = 0;
                shiftIds.forEach(id => {
                    this.caregiverService.payPatientShift(id).subscribe(() => {
                        processed++;
                        if (processed === shiftIds.length) {
                            Swal.fire('¡Cobrado!', 'Se actualizó la deuda del paciente a 0.', 'success');
                            this.loadPatientUnpaidShifts();
                        }
                    });
                });
            }
        });
    }

    // ---------------------------------------------------

    formatTime(totalSeconds: number): string {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
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

    // --- NUEVA LÓGICA: Solicitudes Pendientes ---
    loadPendingRequests() {
        this.matchingService.getPendingRequests().subscribe({
            next: (requests) => this.pendingPatientRequests = requests,
            error: (err) => console.error('Error cargando solicitudes pendientes', err)
        });
    }

    publishPatientRequest(id: number) {
        Swal.fire({
            title: '¿Publicar Solicitud?',
            text: 'Esta solicitud será visible para todos los cuidadores al instante.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Publicar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                this.matchingService.publishPendingRequest(id).subscribe({
                    next: () => {
                        Swal.fire('¡Publicado!', 'La guardia ha sido publicada.', 'success');

                        // Notificar a todos los cuidadores sobre la nueva búsqueda
                        const reqAsPost = this.pendingPatientRequests.find(req => req.id === id);
                        if (reqAsPost) {
                            this.notificationService.addNotification({
                                title: '¡Nueva Guardia Disponible!',
                                message: `Se busca especialista para el paciente ${reqAsPost.patientName}.`,
                                type: 'info',
                                recipientRole: 'caregiver',
                                relatedPostId: id
                            });
                        }

                        // Eliminar de la lista local inmediatamente para evitar doble clic
                        this.pendingPatientRequests = this.pendingPatientRequests.filter(req => req.id !== id);

                        // Refrescar desde el backend
                        this.loadPendingRequests();

                        // Opcional: limpiar notificaciones relacionadas a esta publicación (asumiendo lectura)
                        const relatedNotif = this.notifications.find(n => n.message.includes('solicitado un cuidador'));
                        if (relatedNotif) {
                            this.notificationService.removeNotification(relatedNotif.id);
                        }
                    },
                    error: (err) => {
                        console.error('Error al publicar solicitud:', err);
                        Swal.fire('Error', 'No se pudo publicar la solicitud.', 'error');
                    }
                });
            }
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
                // Notificamos a la familia para que su UI se actualice
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
