import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/core/services/profile.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { PatientService } from 'src/app/core/services/patient.service';
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

    constructor(
        private router: Router,
        private profileService: ProfileService,
        private caregiverService: CaregiverService,
        private patientService: PatientService
    ) { }

    onLogin() {
        this.isLoading = true;

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
                        Swal.fire('Error', 'No se encontró un cuidador con ese nombre en la base de datos.', 'error');
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error(err);
                    Swal.fire('Error', 'Error de conexión con el servidor', 'error');
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
                        Swal.fire('Error', 'No se encontró un paciente con ese nombre en la base de datos.', 'error');
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error(err);
                    Swal.fire('Error', 'Error de conexión con el servidor', 'error');
                }
            });
            return;
        }

        setTimeout(async () => {
            try {
                let target = '/admin';
                switch (this.selectedRole) {
                    case 'admin':
                        target = '/admin';
                        break;
                }

                const success = await this.router.navigate([target]);
                if (success) {
                    // Si el login fue exitoso y se escribió un nombre, lo guardamos en el ProfileService
                    if (this.username.trim() !== '') {
                        // Podemos usar solo la primera parte del email como nombre si tiene arroba
                        const displayName = this.username.split('@')[0];
                        // Capitalizamos la primera letra
                        const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                        this.profileService.setUserName(capitalizedName);
                    }
                } else {
                    this.isLoading = false;
                    console.error('Navigation rejected');
                }
            } catch (error) {
                this.isLoading = false;
                console.error('Navigation error:', error);
            }
        }, 1500);
    }
}
