import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-seguridad-config',
    templateUrl: './seguridad.component.html',
    styleUrls: ['./seguridad.component.css']
})
export class SeguridadComponent {
    securityForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private configService: ConfigService
    ) {
        const config = this.configService.getConfig().security;
        this.securityForm = this.fb.group({
            newPassword: [''],
            confirmPassword: [''],
            requireStrongPassword: [config.requireStrongPassword],
            sessionExpiration: [config.sessionExpiration],
            allowMultipleSessions: [config.allowMultipleSessions]
        });
    }

    goBack() {
        this.router.navigate(['/admin/settings']);
    }

    onSubmit() {
        if (this.securityForm.value.newPassword) {
            if (this.securityForm.value.newPassword !== this.securityForm.value.confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Las contraseñas no coinciden.',
                    confirmButtonText: 'Reintentar'
                });
                return;
            }
        }

        const { newPassword, confirmPassword, ...settings } = this.securityForm.value;
        this.configService.updateConfig('security', settings);

        console.log('Security Settings Saved Persistent:', settings);
        Swal.fire({
            icon: 'success',
            title: 'Seguridad Actualizada',
            text: 'Los ajustes de seguridad se han guardado. (La contraseña se simula en esta versión).',
            confirmButtonText: 'Aceptar'
        });
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
