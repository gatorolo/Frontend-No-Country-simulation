import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-family-view',
    templateUrl: './family-view.component.html',
    styleUrls: ['./family-view.component.css']
})
export class FamilyViewComponent implements OnInit {
    // Mock data for display (simulating the saved state)
    patientData = {
        name: 'Roberto Sánchez',
        age: 78,
        diagnosis: 'Alzheimer en etapa temprana e Hipertensión',
        insurance: 'OSDE 310',
        location: 'https://www.google.com/maps/place/Panader%C3%ADa+Artesanal+189/@-17.7932993,-63.1807397,18z/data=!4m15!1m8!3m7!1s0x915edf8977bba295:0x1c9ec2bb0115edbf!2sBolivia!3b1!8m2!3d-16.290154!4d-63.588653!16zL20vMDE2NXY!3m5!1s0x93f1e92101e9dfdb:0xc1dcd9b85c201702!8m2!3d-17.7933773!4d-63.1790827!16s%2Fg%2F11s5725zvn?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D',
        medications: [
            { name: 'Enalapril 10mg', schedule: '08:00, 20:00' },
            { name: 'Memantina 10mg', schedule: '09:00' }
        ],
        caregiver: {
            name: 'Lara Martínez',
            specialty: 'Enfermería'
        }
    };

    constructor(private router: Router) { }

    ngOnInit(): void {
        // In a real app, we would load the data here
    }

    onEdit() {
        this.router.navigate(['/family']);
    }

    onLogout() {
        this.router.navigate(['/login']);
    }
}
