import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notificaciones-config',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent {
  notificationsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configService: ConfigService
  ) {
    const config = this.configService.getConfig().notifications;
    this.notificationsForm = this.fb.group({
      emailNotifications: [config.emailNotifications],
      criticalErrors: [config.criticalErrors],
      importantEvents: [config.importantEvents],
      onUserCreate: [config.onUserCreate],
      onPasswordChange: [config.onPasswordChange],
      frequency: [config.frequency]
    });
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  onSubmit() {
    this.configService.updateConfig('notifications', this.notificationsForm.value);
    console.log('Notification Settings Saved Persistent:', this.notificationsForm.value);
    Swal.fire({
      icon: 'success',
      title: 'Preferencias Guardadas',
      text: 'Tus ajustes de notificaciones se han actualizado.',
      confirmButtonText: 'Aceptar'
    });
  }
}
