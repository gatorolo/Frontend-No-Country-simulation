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
        status: 'Verificado'
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


    constructor(
        private fb: FormBuilder,
        private configService: ConfigService,
        private matchingService: MatchingService,
        private caregiverService: CaregiverService
    ) { }

    ngOnInit(): void {
        this.initShiftForm();
        this.initCaregiverForm();
        this.configService.whatsappNumber$.subscribe(num => {
            this.whatsappLink = `https://wa.me/${num}`;
        });

        this.matchingService.posts$.subscribe(posts => {
            // 1. New Service Posts (status 'Publicado')
            const publicPosts = posts.filter(p => p.status === 'Publicado');

            // 2. My Approved Applications (status 'Confirmado' && caregiverId === 123 (mock))
            // In a real app, 123 comes from auth user service
            const myApprovedPosts = posts.filter(p => p.status === 'Confirmado' && p.caregiverId === 123);

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


    // 2. Definí el método que te está dando error
    closeModal() {
        this.showModal = false; // Cerramos el modal
        this.caregiverForm.reset({ status: 'Pendiente' }); // Limpiamos el formulario para la próxima
    }

    // 3. (Opcional) El método para abrirlo
    openModal() {
        this.showModal = true;
    }

    // 1. Para cargar la lista (Error de getAllCaregivers)
    loadCaregivers() {
        this.caregiverService.getAllCaregivers().subscribe({
            next: (data: any) => { // Agregamos :any para el error TS7006
                console.log('Cuidadores cargados', data);
            },
            error: (err: any) => console.error(err)
        });
    }

    // 2. Para agregar o actualizar (Error de addCaregiver)
    saveCaregiver() {
        const cgData = this.caregiverForm.value;
        this.caregiverService.addCaregiver(cgData).subscribe({
            next: (res: any) => { // Agregamos :any
                console.log('Operación exitosa', res);
                this.closeModal();
            },
            error: (err: any) => console.error('Error al procesar', err)
        });
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0; // Mark as read when opened
        }
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
            // Note: Currently not used in templates, but defined to avoid TS error
            // and provide a place for future caregiver profile editing forms.
            fullName: [this.profileData.fullName, Validators.required],
            phone: [this.profileData.phone, Validators.required],
            email: [this.profileData.email, [Validators.required, Validators.email]]
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
