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
        this.isLoading = true;

        // Si se proporciona contraseña, intentamos el login real con 2FA
        if (this.password.trim() !== '') {
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
                    console.error('Login error, falling back to legacy auth', err);
                    this.legacyAuth();
                }
            });
            return;
        }

        this.legacyAuth();
    }

    onVerify2FA() {
        this.isLoading = true;
        this.auth2FAService.verify2FA(this.username, parseInt(this.twoFactorCode)).subscribe({
            next: (res) => {
                this.handleLoginSuccess(res);
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'Código 2FA inválido', 'error');
            }
        });
    }

    private handleLoginSuccess(res: any) {
        this.profileService.setUserName(res.username || this.username.split('@')[0]);
        const target = res.role === 'admin' ? '/admin' : (res.role === 'caregiver' ? '/caregiver' : '/family');
        this.router.navigate([target]).then(() => {
            this.isLoading = false;
        });
    }

    private legacyAuth() {
        if (this.selectedRole === 'caregiver' && this.username.trim() !== '') {
            this.caregiverService.getAllCaregivers().subscribe({
                next: (caregivers) => {
                    const typedName = this.username.trim().toLowerCase();
                    const foundCv = caregivers.find(c =>
                        (c.caregiverName && c.caregiverName.toLowerCase().includes(typedName)) ||
                        (c.fullName && c.fullName.toLowerCase().includes(typedName))
                    );

                    if (foundCv && foundCv.id) {
                        this.profileService.setUserId(foundCv.id);
                        this.profileService.setUserName(foundCv.caregiverName || foundCv.fullName || typedName);
                        this.router.navigate(['/caregiver']).then(() => {
                            this.isLoading = false;
                        });
                    } else {
                        this.isLoading = false;
                        Swal.fire('Error', 'No se encontró un cuidador con ese nombre.', 'error');
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    Swal.fire('Error', 'Error de conexión', 'error');
                }
            });
            return;
        }

        if (this.selectedRole === 'patient' && this.username.trim() !== '') {
            this.patientService.getPatientsFromApi().subscribe({
                next: (patients) => {
                    const typedName = this.username.trim().toLowerCase();
                    const foundPt = patients.find(p =>
                        p.name && p.name.toLowerCase().includes(typedName)
                    );

                    if (foundPt && foundPt.id) {
                        this.profileService.setUserId(foundPt.id);
                        this.profileService.setUserName(foundPt.name || typedName);
                        this.router.navigate([`/family/view/${foundPt.id}`]).then(() => {
                            this.isLoading = false;
                        });
                    } else {
                        this.isLoading = false;
                        Swal.fire('Error', 'No se encontró un paciente con ese nombre.', 'error');
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    Swal.fire('Error', 'Error de conexión', 'error');
                }
            });
            return;
        }

        // Mock Admin login
        setTimeout(() => {
            this.router.navigate(['/admin']).then(() => {
                this.isLoading = false;
                this.profileService.setUserName(this.username.split('@')[0]);
            });
        }, 1000);
    }
}
