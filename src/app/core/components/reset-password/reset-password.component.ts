import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../constants/api.constants';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['../login/login.component.css']
})
export class ResetPasswordComponent implements OnInit {
    token: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    isLoading: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        if (!this.token) {
            Swal.fire('Error', 'Token de recuperación no válido', 'error');
            this.router.navigate(['/login']);
        }
    }

    onSubmit() {
        if (this.newPassword !== this.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }

        this.isLoading = true;
        this.http.post(`${API_BASE_URL}/auth/reset-password`, {
            token: this.token,
            newPassword: this.newPassword
        }).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                Swal.fire('¡Éxito!', 'Tu contraseña ha sido restablecida.', 'success');
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.isLoading = false;
                const msg = err.error?.message || 'Error al restablecer la contraseña. El token puede haber expirado.';
                Swal.fire('Error', msg, 'error');
            }
        });
    }
}
