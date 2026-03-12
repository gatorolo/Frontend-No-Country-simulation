import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth2FAService } from 'src/app/core/services/auth-2fa.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-register',
    templateUrl: './admin-register.component.html',
    styleUrls: ['../login/login.component.css'] // Reuse login styles
})
export class AdminRegisterComponent {
    isLoading = false;
    username = '';
    email = '';
    password = '';
    confirmPassword = '';

    constructor(
        private authService: Auth2FAService,
        private router: Router
    ) { }

    onSubmit() {
        if (!this.username || !this.email || !this.password || !this.confirmPassword) {
            Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
            return;
        }

        if (this.password !== this.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }

        this.isLoading = true;
        const request = {
            username: this.username,
            email: this.email,
            password: this.password,
            role: 'ADMIN'
        };

        this.authService.register(request).subscribe({
            next: (res) => {
                this.isLoading = false;
                Swal.fire('¡Éxito!', 'Cuenta de administrador creada satisfactoriamente.', 'success');
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.isLoading = false;
                const msg = err.error?.message || 'Error al crear la cuenta';
                Swal.fire('Error', msg, 'error');
            }
        });
    }
}
