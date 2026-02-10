import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notificaciones-config',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent {
  notificationsForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.notificationsForm = this.fb.group({
      emailNotifications: [true],
      criticalErrors: [true],
      importantEvents: [true],
      onUserCreate: [true],
      onPasswordChange: [true],
      frequency: ['immediate']
    });
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  onSubmit() {
    console.log('Notification Settings Saved:', this.notificationsForm.value);
  }
}
