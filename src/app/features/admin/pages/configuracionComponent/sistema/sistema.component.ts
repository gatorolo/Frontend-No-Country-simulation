import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sistema-config',
  templateUrl: './sistema.component.html',
  styleUrls: ['./sistema.component.css']
})
export class SistemaComponent {
  systemInfo = {
    frontendVersion: 'v1.0.0',
    apiVersion: 'v1.0.5-beta',
    environment: 'Development',
    maintenanceMode: false,
    lastUpdate: '2026-02-08 14:30:00'
  };

  constructor(private router: Router) { }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  toggleMaintenance() {
    this.systemInfo.maintenanceMode = !this.systemInfo.maintenanceMode;
    console.log('Maintenance Mode:', this.systemInfo.maintenanceMode);
  }

  clearCache() {
    Swal.fire({
      icon: 'success',
      title: '¡Listo!',
      text: 'La caché del sistema se limpió correctamente.',
      confirmButtonText: 'Aceptar',
    });
  }
}
