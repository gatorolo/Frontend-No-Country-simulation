import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-apariencia-config',
  templateUrl: './apariencia.component.html',
  styleUrls: ['./apariencia.component.css']
})
export class AparienciaComponent {
  appearanceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configService: ConfigService
  ) {
    const config = this.configService.getConfig().appearance;
    this.appearanceForm = this.fb.group({
      darkMode: [config.darkMode],
      useAutoTheme: [config.useAutoTheme || false],
      primaryColor: [config.primaryColor],
      showLogoInSidebar: [config.showLogoInSidebar]
    });
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  onSubmit() {
    this.configService.updateConfig('appearance', this.appearanceForm.value);
    console.log('Appearance Settings Saved Persistent:', this.appearanceForm.value);
    Swal.fire({
      icon: 'success',
      title: 'Apariencia Actualizada',
      text: 'Los cambios de diseño se han aplicado correctamente.',
      confirmButtonText: 'Aceptar'
    });
  }

  onFileUpload(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      console.log(`Uploading ${type}...`, file);
      Swal.fire({
        icon: 'info',
        title: 'Simulación de Carga',
        text: `El archivo "${file.name}" se cargaría como nuevo ${type} en el servidor.`,
        confirmButtonText: 'Entendido'
      });
    }
  }
}
