import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { ProfileService } from 'src/app/core/services/profile.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-apariencia-config',
  templateUrl: './apariencia.component.html',
  styleUrls: ['./apariencia.component.css']
})
export class AparienciaComponent implements OnInit {
  appearanceForm: FormGroup;
  currentAvatar: string = 'assets/user-placeholder.png';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configService: ConfigService,
    private profileService: ProfileService
  ) {
    const config = this.configService.getConfig().appearance;
    this.appearanceForm = this.fb.group({
      darkMode: [config.darkMode],
      useAutoTheme: [config.useAutoTheme || false],
      primaryColor: [config.primaryColor],
      showLogoInSidebar: [config.showLogoInSidebar]
    });
  }

  ngOnInit(): void {
    this.profileService.userAvatar$.subscribe(avatar => this.currentAvatar = avatar);
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  onSubmit() {
    this.configService.updateConfig('appearance', this.appearanceForm.value);
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
      Swal.fire({
        icon: 'info',
        title: 'Simulación de Carga',
        text: `El archivo "${file.name}" se cargaría como nuevo ${type} en el servidor.`,
        confirmButtonText: 'Entendido'
      });
    }
  }

  onAdminAvatarUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result as string;
      this.profileService.setUserAvatar(base64);
      Swal.fire({
        icon: 'success',
        title: '¡Foto actualizada!',
        text: 'Tu foto de perfil ya aparece en el header.',
        timer: 2000,
        showConfirmButton: false
      });
    };
    reader.readAsDataURL(file);
  }
}
