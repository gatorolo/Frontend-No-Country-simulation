import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { ConfigService } from 'src/app/core/services/config.service';
import { MatchingService } from 'src/app/core/services/matching.service';

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

    // Static data for the professional profile
    profileData = {
        fullName: 'Lara Martínez',
        dni: '35.123.456',
        phone: '+54 9 341 510-9918',
        email: 'lara.martinez@valora.com',
        address: 'Av. Pellegrini 1234, Rosario',
        hourlyRate: 1500,
        specialty: 'Enfermería Geriátrica',
        paymentTarget: 'CBU: 0000054321000098765432 / Mercado Pago',
        status: 'Falta verificar'
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
        private caregiverService: CaregiverService
    ) { }

    clearedPostIds: number[] = [];

    ngOnInit(): void {
        this.loadClearedPostIds();
        this.initShiftForm();
        this.initCaregiverForm();
        this.configService.config$.subscribe(config => {
            this.whatsappLink = `https://wa.me/${config.general.whatsappNumber}`;
        });

        this.matchingService.posts$.subscribe(posts => {
            // 1. New Service Posts (status 'Publicado')
            const publicPosts = posts.filter(p => p.status === 'Publicado' && !this.clearedPostIds.includes(p.id));

            // 2. My Approved Applications
            const myApprovedPosts = posts.filter(p => p.status === 'Confirmado' && p.caregiverId === 123 && !this.clearedPostIds.includes(p.id));

            const allNotifications = [...publicPosts, ...myApprovedPosts];

            if (allNotifications.length > this.notifications.length) {
                const countDiff = allNotifications.length - this.notifications.length;
                if (countDiff > 0) {
                    this.unreadCount += countDiff;
                }
                this.notifications = allNotifications;
            } else {
                this.notifications = allNotifications;
            }
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
            fullName: this.profileData.fullName,
            dni: this.profileData.dni,
            phone: this.profileData.phone,
            email: this.profileData.email,
            address: this.profileData.address,
            hourlyRate: this.profileData.hourlyRate,
            specialty: this.profileData.specialty,
            paymentTarget: this.profileData.paymentTarget
        });
        this.showProfileModal = true;
    }

    saveProfile() {
        if (this.caregiverForm.invalid) return;

        const updatedData = this.caregiverForm.value;
        // Simulamos el ID 123 para el cuidador actual (Lara Martínez)
        this.caregiverService.updateCaregiver(123, updatedData).subscribe({
            next: (res: any) => {
                console.log('Perfil actualizado en BD', res);
                // Actualizamos la vista local inmediata
                this.profileData = {
                    ...this.profileData,
                    ...updatedData
                };
                this.closeModal();
            },
            error: (err: any) => {
                console.error('Error al actualizar perfil', err);
                // Fallback: actualizamos localmente si falla la API (para demo)
                this.profileData = { ...this.profileData, ...updatedData };
                this.closeModal();
            }
        });
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0; // Marca como leídas al abrir
        }
    }

    removeNotification(event: Event, id: number) {
        event.stopPropagation();
        if (!this.clearedPostIds.includes(id)) {
            this.clearedPostIds.push(id);
            this.saveClearedPostIds();
        }
        // Forzamos actualización local inmediata
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clearAllNotifications() {
        this.notifications.forEach(n => {
            if (!this.clearedPostIds.includes(n.id)) {
                this.clearedPostIds.push(n.id);
            }
        });
        this.saveClearedPostIds();
        this.notifications = [];
        this.showNotifications = false;
    }

    selectedNotification: any = null;

    openNotificationDetail(notification: any) {
        this.selectedNotification = notification;
        this.showNotifications = false; // Close dropdown
    }

    closeNotificationDetail() {
        this.selectedNotification = null;
    }

    applyToService() {
        if (this.selectedNotification) {
            const caregiverId = 123;
            const caregiverName = this.profileData.fullName;

            this.matchingService.applyToPost(this.selectedNotification.id, caregiverId, caregiverName).subscribe({
                next: () => {
                    alert(`Te has postulado correctamente para la guardia de ${this.selectedNotification.patientName}`);
                    this.closeNotificationDetail();
                },
                error: (err) => {
                    console.error('Error al postularse:', err);
                    alert('Hubo un error al postularse. Por favor, intenta nuevamente.');
                }
            });
        }
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
            fullName: [this.profileData.fullName, Validators.required],
            dni: [this.profileData.dni, Validators.required],
            phone: [this.profileData.phone, Validators.required],
            email: [this.profileData.email, [Validators.required, Validators.email]],
            address: [this.profileData.address, Validators.required],
            hourlyRate: [this.profileData.hourlyRate, [Validators.required, Validators.min(0)]],
            specialty: [this.profileData.specialty, Validators.required],
            paymentTarget: [this.profileData.paymentTarget, Validators.required]
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
