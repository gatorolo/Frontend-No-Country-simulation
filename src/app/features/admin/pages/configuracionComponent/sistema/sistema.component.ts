import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
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

  constructor(
    private router: Router,
    private configService: ConfigService
  ) {
    this.systemInfo.maintenanceMode = this.configService.getConfig().system.maintenanceMode;
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  toggleMaintenance() {
    this.systemInfo.maintenanceMode = !this.systemInfo.maintenanceMode;
    this.configService.updateConfig('system', { maintenanceMode: this.systemInfo.maintenanceMode });
    console.log('Maintenance Mode Persistent:', this.systemInfo.maintenanceMode);

    Swal.fire({
      icon: this.systemInfo.maintenanceMode ? 'warning' : 'success',
      title: this.systemInfo.maintenanceMode ? 'Modo Mantenimiento Activado' : 'Modo Mantenimiento Desactivado',
      text: this.systemInfo.maintenanceMode ? 'El sistema ahora solo es accesible para administradores.' : 'El sistema vuelve a estar disponible para todos.',
      confirmButtonText: 'Aceptar'
    });
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
