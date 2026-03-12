import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../constants/api.constants';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent {
    email: string = '';
    isLoading: boolean = false;
    message: string = '';

    constructor(private http: HttpClient) { }

    onSubmit() {
        if (!this.email) return;

        this.isLoading = true;
        this.http.post(`${API_BASE_URL}/auth/forgot-password`, { email: this.email }).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.message = 'Si el correo existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.';
                Swal.fire('Enviado', this.message, 'success');
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'No Pudimos procesar tu solicitud. Inténtalo de nuevo.', 'error');
            }
        });
    }
}
