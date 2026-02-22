import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    isLoading = false;
    selectedRole: string = 'admin';

    constructor(private router: Router) { }

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
                        target = '/family/view/23';
                        break;
                }

                const success = await this.router.navigate([target]);
                if (!success) {
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
