import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../constants/api.constants';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    isLoading = false;
    selectedRole: string = 'CAREGIVER'; // Default to caregiver

    // Shared Fields
    fullName: string = '';

    // Caregiver Fields
    dni: string = '';
    specialty: string = '';
    phone: string = '';
    hourlyRate: number = 0;
    address: string = '';

    // Patient Fields
    age: number = 0;
    healthInsurance: string = '';
    diagnosis: string = '';
    city: string = '';
    zone: string = '';
    locationLink: string = '';

    successMessage: string = '';
    errorMessage: string = '';

    constructor(private http: HttpClient, private router: Router) { }

    onSubmit() {
        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        let payload: any = {};

        if (this.selectedRole === 'CAREGIVER') {
            payload = {
                caregiverName: this.fullName,
                dni: this.dni,
                specialty: this.specialty,
                phone: this.phone,
                hourlyRate: this.hourlyRate,
                address: this.address
            };
        } else {
            payload = {
                name: this.fullName,
                age: this.age,
                healthInsurance: this.healthInsurance,
                diagnosis: this.diagnosis,
                city: this.city,
                zone: this.zone,
                locationLink: this.locationLink
            };
        }

        const requestBody = {
            role: this.selectedRole,
            applicantName: this.fullName,
            rawData: JSON.stringify(payload)
        };

        this.http.post(`${API_BASE_URL}/registrations`, requestBody).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.successMessage = '¡Solicitud enviada con éxito! Un administrador revisará tus datos.';
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 4000);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo.';
                console.error(err);
            }
        });
    }
}
