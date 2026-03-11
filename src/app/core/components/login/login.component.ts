import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/core/services/profile.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { Auth2FAService } from 'src/app/core/services/auth-2fa.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    isLoading = false;
    selectedRole: string = 'admin';
    username: string = '';
    password: string = '';
    show2FAForm: boolean = false;
    twoFactorCode: string = '';

    constructor(
        private router: Router,
        private profileService: ProfileService,
        private caregiverService: CaregiverService,
        private patientService: PatientService,
        private auth2FAService: Auth2FAService
    ) { }

    onLogin() {
        if (!this.username || !this.password) {
            Swal.fire('Atención', 'Por favor ingresa usuario y contraseña', 'warning');
            return;
        }

        this.isLoading = true;
        this.auth2FAService.login({ username: this.username, password: this.password }).subscribe({
            next: (res) => {
                if (res.requires2FA) {
                    this.show2FAForm = true;
                    this.isLoading = false;
                } else {
                    this.handleLoginSuccess(res);
                }
            },
            error: (err) => {
                this.isLoading = false;
                const msg = err.error?.message || 'Error de autenticación. Verifica tus credenciales.';
                Swal.fire('Error', msg, 'error');
            }
        });
    }

    onVerify2FA() {
        if (!this.twoFactorCode) return;

        this.isLoading = true;
        this.auth2FAService.verify2FA(this.username, parseInt(this.twoFactorCode)).subscribe({
            next: (res) => {
                this.handleLoginSuccess(res);
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'Código de verificación inválido', 'error');
            }
        });
    }

    private handleLoginSuccess(res: any) {
        // Guardamos el token real
        if (res.token) {
            this.auth2FAService.saveToken(res.token);
        }

        this.profileService.setUserName(res.username || this.username);

        // El backend devuelve el rol real del usuario
        const role = res.role ? res.role.toLowerCase() : 'admin';
        const target = role === 'admin' ? '/admin' : (role === 'caregiver' ? '/caregiver' : '/family');

        this.router.navigate([target]).then(() => {
            this.isLoading = false;
        });
    }
}
