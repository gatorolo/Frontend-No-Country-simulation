import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-seguridad-config',
    templateUrl: './seguridad.component.html',
    styleUrls: ['./seguridad.component.css']
})
export class SeguridadComponent {
    securityForm: FormGroup;

    constructor(private fb: FormBuilder, private router: Router) {
        this.securityForm = this.fb.group({
            newPassword: [''],
            confirmPassword: [''],
            requireStrongPassword: [true],
            sessionExpiration: ['30min'],
            allowMultipleSessions: [false]
        });
    }

    goBack() {
        this.router.navigate(['/admin/settings']);
    }

    onSubmit() {
        console.log('Security Settings Saved:', this.securityForm.value);
    }

    closeAllSessions() {
        Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'Todas las sesiones cerradas correctamente.',
            confirmButtonText: 'Aceptar',
        });
    }
}
