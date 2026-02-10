import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigService } from 'src/app/core/services/config.service';

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

    constructor(
        private fb: FormBuilder,
        private configService: ConfigService
    ) { }

    ngOnInit(): void {
        this.initShiftForm();
        this.configService.whatsappNumber$.subscribe(num => {
            this.whatsappLink = `https://wa.me/${num}`;
        });
    }

    private initShiftForm() {
        this.shiftForm = this.fb.group({
            patientId: ['', Validators.required],
            startTimeInput: ['', Validators.required],
            notes: ['']
        });
    }

    setTab(tab: 'activity' | 'profile' | 'history') {
        this.activeTab = tab;
    }

    // Shift Logic
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

        // Save to history
        this.shiftHistory.unshift({
            patient: patientName,
            date: new Date().toLocaleDateString(),
            duration: this.shiftDuration.substring(0, 5) + ' hs',
            earned: 6000 // Mock value
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
