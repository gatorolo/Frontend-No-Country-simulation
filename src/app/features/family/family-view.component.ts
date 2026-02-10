import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService, Patient } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-family-view',
    templateUrl: './family-view.component.html',
    styleUrls: ['./family-view.component.css']
})
export class FamilyViewComponent implements OnInit {
    whatsappLink = '';
    patientData: any = null;
    currentPatientId = 1;

    constructor(
        private router: Router,
        private configService: ConfigService,
        private patientService: PatientService
    ) { }

    ngOnInit(): void {
        this.configService.whatsappNumber$.subscribe(num => {
            this.whatsappLink = `https://wa.me/${num}`;
        });

        this.patientService.patients$.subscribe(patients => {
            const p = patients.find(patient => patient.id === this.currentPatientId);
            if (p) {
                // Adapt Patient model to what the template expects
                this.patientData = {
                    ...p,
                    insurance: p.healthInsurance,
                    location: p.locationLink,
                    caregiver: {
                        name: 'Lara Martínez', // Still mocked for now as it depends on assignment
                        specialty: 'Enfermería'
                    }
                };
            }
        });
    }

    onEdit() {
        this.router.navigate(['/family']);
    }

    onLogout() {
        this.router.navigate(['/login']);
    }
}
