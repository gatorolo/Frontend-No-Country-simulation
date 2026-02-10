import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-caregiver-dashboard',
    templateUrl: './caregiver.component.html',
    styleUrls: ['./caregiver.component.css']
})
export class CaregiverComponent implements OnInit {
    // Forms
    profileForm!: FormGroup;
    shiftForm!: FormGroup;

    // View State
    activeTab: 'profile' | 'activity' | 'history' = 'activity';
    isShiftActive = false;
    shiftDuration = '00:00:00';
    private shiftTimer: any;
    private startTime!: Date;

    // Mock Data
    patients = [
        { id: 1, name: 'Juan Pérez' },
        { id: 2, name: 'María Garcia' },
        { id: 3, name: 'Roberto Sánchez' }
    ];

    shiftHistory = [
        { patient: 'Juan Pérez', date: '2024-02-08', duration: '8h 00m', earned: 32000 },
        { patient: 'María Garcia', date: '2024-02-09', duration: '6h 30m', earned: 26000 }
    ];

    constructor(private fb: FormBuilder, private router: Router) { }

    ngOnInit(): void {
        this.initForms();
    }

    private initForms() {
        this.profileForm = this.fb.group({
            fullName: ['Lara Martínez', Validators.required],
            dni: ['12.345.678', Validators.required],
            phone: ['+54 9 341 510-9918', Validators.required],
            address: ['Calle Falsa 123, Rosario', Validators.required],
            hourlyRate: [4000, [Validators.required, Validators.min(0)]],
            paymentTarget: ['laram.mp', Validators.required], // Alias or CBU
            status: ['Verificado'] // Verificado o Pendiente
        });

        this.shiftForm = this.fb.group({
            patientId: ['', Validators.required],
            startTimeInput: ['', Validators.required], // New field for manual entry
            notes: ['']
        });
    }

    // Tab Navigation
    setTab(tab: 'profile' | 'activity' | 'history') {
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

        // Get manual start time from form and combine with current date
        const timeValue = this.shiftForm.value.startTimeInput; // Expected "HH:mm"
        const [hours, minutes] = timeValue.split(':').map(Number);

        this.startTime = new Date();
        this.startTime.setHours(hours, minutes, 0, 0);

        // If the manual time is in the future (compared to current time), 
        // we assume it was for yesterday or just handle as is. 
        // For shift logic, we usually want it to be today's past time.
        if (this.startTime > new Date()) {
            this.startTime.setDate(this.startTime.getDate() - 1);
        }

        this.shiftTimer = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - this.startTime.getTime();
            this.shiftDuration = this.formatDuration(diff);
        }, 1000);
    }

    private stopShift() {
        this.isShiftActive = false;
        clearInterval(this.shiftTimer);

        // Prepare data for "FastAPI" (Lógica de Alejandro)
        const shiftData = {
            id_cuidador: 1, // Mock current user
            id_paciente: this.shiftForm.value.patientId,
            inicio: this.startTime,
            fin: new Date(),
            informe: this.shiftForm.value.notes
        };

        console.log('Sending to FastAPI POST /api/caregivers/shift:', shiftData);

        // Reset and save to history (locally for demo)
        const earned = ((new Date().getTime() - this.startTime.getTime()) / 3600000) * this.profileForm.value.hourlyRate;
        this.shiftHistory.unshift({
            patient: this.patients.find(p => p.id == this.shiftForm.value.patientId)?.name || 'N/A',
            date: new Date().toLocaleDateString(),
            duration: this.shiftDuration,
            earned: Math.round(earned)
        });

        this.shiftForm.reset();
        this.shiftDuration = '00:00:00';
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    onFileUpload(event: any, docType: string) {
        const file = event.target.files[0];
        console.log(`Uploading ${docType}:`, file?.name);
        // Integrate with backend here
    }

    onLogout() {
        this.router.navigate(['/login']);
    }
}
