import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { ConfigService } from 'src/app/core/services/config.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-caregiver-dashboard',
    templateUrl: './caregiver.component.html',
    styleUrls: ['./caregiver.component.css']
})
export class CaregiverComponent implements OnInit {
    activeTab: 'activity' | 'profile' | 'history' = 'activity';
    isShiftActive = false;
    shiftDuration = '00:00:00';
    shiftForm!: FormGroup;
    whatsappLink = '';
    posts: any[] = [];

    // Static data for the professional profile
    profileData: any = {
        id: null,
        caregiverName: '',
        dni: '',
        phone: '',
        city: '',
        address: '',
        hourlyRate: 0,
        specialty: '',
        status: ''
    };

    patients = [
        { id: 1, name: 'Roberto Sánchez' },
        { id: 2, name: 'Marta García' }
    ];

    shiftHistory = [
        { patient: 'Roberto Sánchez', date: '08/02/2026', duration: '08:00 hs', earned: 12000 },
        { patient: 'Roberto Sánchez', date: '09/02/2026', duration: '04:00 hs', earned: 6000 }
    ];

    private timerInterval: any;

    notifications: any[] = [];
    unreadCount = 0;
    showNotifications = false;
    caregiverForm!: FormGroup;
    showModal: boolean = false;
    showProfileModal: boolean = false;


    constructor(
        private fb: FormBuilder,
        private configService: ConfigService,
        private matchingService: MatchingService,
        private caregiverService: CaregiverService,
        private notificationService: NotificationService
    ) { }

    clearedPostIds: number[] = [];

    ngOnInit(): void {
        this.loadClearedPostIds();
        this.initShiftForm();
        this.loadProfile();
        this.initCaregiverForm();

        // 1. Configuración de WhatsApp
        this.configService.config$.subscribe(config => {
            this.whatsappLink = `https://wa.me/${config.general.whatsappNumber}`;
        });

        // 2. Suscripción a Notificaciones (La que maneja la campanita)
        this.notificationService.notifications$.subscribe(allNotifs => {
            // Filtramos solo las que son para el CUIDADOR
            const caregiverNotifs = allNotifs.filter(n => n.recipientRole === 'caregiver');

            // Manejo del contador de no leídos
            const unread = caregiverNotifs.filter(n => !n.read).length;
            this.unreadCount = unread;

            this.notifications = caregiverNotifs;
            console.log('🔔 Notificaciones del Service actualizadas:', this.notifications);

        });

        this.matchingService.posts$.subscribe(posts => {
            this.posts = posts;
        });
    }



    loadProfile() {
        // Cargamos el perfil del cuidador actual (ID 1 por defecto en esta versión)
        this.caregiverService.getCaregiverById(1).subscribe({
            next: (data) => {
                // Mapeo robusto: Java a veces devuelve 'name' y el front usa 'fullName'
                this.profileData = data;
                console.log('✅ Perfil cargado correctamente:', this.profileData);

                // Si usas un formulario para el perfil, actualízalo aquí
                if (this.caregiverForm && data) {
                    this.caregiverForm.patchValue(data);
                }
            },
            error: (err) => console.error('❌ Error al cargar el perfil:', err)
        });
    }

    private loadClearedPostIds() {
        const saved = localStorage.getItem('valora_cleared_posts');
        if (saved) {
            try {
                this.clearedPostIds = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading cleared posts', e);
            }
        }
    }

    private saveClearedPostIds() {
        localStorage.setItem('valora_cleared_posts', JSON.stringify(this.clearedPostIds));
    }


    closeModal() {
        this.showModal = false;
        this.showProfileModal = false;
    }

    openEditProfileModal() {
        this.caregiverForm.patchValue({
            caregiverName: this.profileData.caregiverName,
            dni: this.profileData.dni,
            phone: this.profileData.phone,
            address: this.profileData.address,
            city: this.profileData.city,
            hourlyRate: this.profileData.hourlyRate,
            specialty: this.profileData.specialty,
            status: this.profileData.status

        });
        this.showProfileModal = true;
    }

    saveProfile() {
        if (this.caregiverForm.invalid) return;

        const caregiverId = this.profileData?.id || 1;
        const formValues = this.caregiverForm.value;

        const payload = {
            ...this.profileData,       // Trae ID y otros campos
            ...formValues,             // Trae caregiverName, city, etc.
            // FORZAMOS LA SINCRONIZACIÓN:
            caregiverName: formValues.caregiverName,
            fullName: formValues.caregiverName, // Enviamos el mismo valor a ambas columnas por si acaso
            status: this.profileData.status || 'Activo'
        };

        console.log('enviando payload:', payload);

        this.caregiverService.updateCaregiver(caregiverId, payload).subscribe({
            next: (res: any) => {
                // Actualizamos la vista con lo que devuelve el servidor
                this.profileData = {
                    ...res,
                    caregiverName: res.caregiverName || res.fullName // Mapeo de seguridad
                };
                this.closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Perfil actualizado',
                    text: 'Los datos se han guardado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (err) => console.error('Error al guardar:', err)
        });
    }


    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0;
        }
    }

    removeNotification(event: Event, id: number) {
        event.stopPropagation();
        if (!this.clearedPostIds.includes(id)) {
            this.clearedPostIds.push(id);
            this.saveClearedPostIds();
        }
        // Llamada al service para persistencia real
        this.notificationService.removeNotification(id);
    }

    clearAllNotifications() {
        // 1. Borramos permanentemente del LocalStorage para el rol de cuidador
        this.notificationService.clearByRole('caregiver');

        // 2. Opcional: También podrías limpiar la variable local por seguridad
        this.notifications = [];
        this.unreadCount = 0;

        console.log('🧹 Notificaciones borradas permanentemente');
    }

    selectedNotification: any = null;

    openNotificationDetail(n: any) {
        // Buscamos el post real para alimentar el modal detallado
        const postReal = this.posts.find(p => p.id === n.relatedPostId);

        if (postReal) {
            this.selectedNotification = postReal; // Aquí el modal tendrá patientName, zone, etc.
        } else {
            this.selectedNotification = n; // Fallback a la notificación
        }
        this.showNotifications = false;

        // Persistimos el estado de "leído"
        this.notificationService.markAsRead(n.id);
    }



    closeNotificationDetail() {
        this.selectedNotification = null;
    }

    applyToService() {
        if (!this.selectedNotification) return;

        const postId = this.selectedNotification.id;
        const caregiverName = this.profileData?.caregiverName || this.profileData?.fullName || this.profileData?.name || 'Cuidador';
        const caregiverId = this.profileData?.id || 1;

        console.log('🚀 Postulando a:', caregiverName);

        this.matchingService.applyToPost(postId, caregiverId, caregiverName).subscribe({
            next: (response: any) => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Postulación enviada!',
                    text: 'El administrador revisará tu solicitud',
                    confirmButtonColor: '#0ea5e9'
                });

                // Notificación para el ADMIN
                this.notificationService.addNotification({
                    title: 'Nueva Postulación',
                    // Aquí usamos la variable que ya tiene el nombre real
                    message: `El cuidador ${caregiverName} se ha postulado para el servicio de ${this.selectedNotification.patientName}.`,
                    type: 'success',
                    recipientRole: 'admin',
                    relatedPostId: postId,
                    // Metadatos extra para que el Admin tenga info aunque el polling falle
                    patientName: this.selectedNotification.patientName,
                    caregiverName: caregiverName,
                    caregiverId: caregiverId,
                    age: this.selectedNotification.age,
                    zone: this.selectedNotification.zone,
                    city: this.selectedNotification.city,
                    schedule: this.selectedNotification.schedule,
                    specialty: this.selectedNotification.specialty,
                    complexity: this.selectedNotification.complexity
                } as any);

                this.closeNotificationDetail();
            },
            error: (err: any) => {
                console.error("Error al postularse:", err);
            }
        });
    }
    private initShiftForm() {
        this.shiftForm = this.fb.group({
            patientId: ['', Validators.required],
            startTimeInput: ['', Validators.required],
            notes: ['']
        });
    }


    private initCaregiverForm() {
        this.caregiverForm = this.fb.group({
            caregiverName: [this.profileData.caregiverName || '', Validators.required],
            dni: [this.profileData.dni || '', Validators.required],
            phone: [this.profileData.phone || ''],
            city: [this.profileData.city || '', Validators.required],
            specialty: [this.profileData.specialty || '', Validators.required],
            hourlyRate: [this.profileData.hourlyRate || 0, [Validators.required, Validators.min(1)]],
            address: [this.profileData.address || ''],
            paymentTarget: [this.profileData.paymentTarget || '', Validators.required]
        });
    }

    setTab(tab: 'activity' | 'profile' | 'history') {
        this.activeTab = tab;
    }


    toggleShift() {
        if (!this.isShiftActive) {
            this.startShift();
        } else {
            this.stopShift();
        }
    }

    private startShift() {
        this.isShiftActive = true;
        let seconds = 0;
        this.timerInterval = setInterval(() => {
            seconds++;
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            this.shiftDuration = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
        }, 1000);
    }

    private stopShift() {
        clearInterval(this.timerInterval);
        this.isShiftActive = false;

        const patientName = this.patients.find(p => p.id === +this.shiftForm.value.patientId)?.name || 'Desconocido';

        this.shiftHistory.unshift({
            patient: patientName,
            date: new Date().toLocaleDateString(),
            duration: this.shiftDuration.substring(0, 5) + ' hs',
            earned: 6000
        });

        this.shiftForm.reset();
        this.shiftDuration = '00:00:00';
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }

    onFileUpload(event: any, docType: string) {
        const file = event.target.files[0];
        console.log(`Uploading ${docType}:`, file?.name);
    }
}
