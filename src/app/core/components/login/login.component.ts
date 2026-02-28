import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/core/services/profile.service';

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
        private profileService: ProfileService
    ) { }

    onLogin() {
        this.isLoading = true;

        setTimeout(async () => {
            try {
                let target = '/admin';
                switch (this.selectedRole) {
                    case 'admin':
                        target = '/admin';
                        break;
                    case 'caregiver':
                        target = '/caregiver';
                        break;
                    case 'patient':
                        target = '/family/view/1';
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
