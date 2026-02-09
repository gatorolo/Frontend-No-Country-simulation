import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  settingsCategories = [
    { title: 'General', description: 'Ajustes básicos y parámetros globales.', icon: 'settings', color: 'blue', route: 'general' },
    { title: 'Seguridad', description: 'Contraseñas, accesos y permisos.', icon: 'shield', color: 'red', route: 'seguridad' },
    { title: 'Notificaciones', description: 'Alertas, correos y avisos del sistema.', icon: 'notifications', color: 'orange', route: 'notificaciones' },
    { title: 'Apariencia', description: 'Temas visuales, logotipos y colores.', icon: 'palette', color: 'purple', route: 'apariencia' },
    { title: 'Sistema', description: 'Mantenimiento y configuración avanzada.', icon: 'dns', color: 'green', route: 'sistema' }
  ];

  constructor(private router: Router) { }

  isSubRouteActive(): boolean {
    return this.router.url !== '/admin/settings';
  }

  navigateTo(route: string) {
    this.router.navigate(['/admin/settings', route]);
  }
}
