import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-general-config',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {
    generalForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private configService: ConfigService
    ) {
        const config = this.configService.getConfig().general;
        this.generalForm = this.fb.group({
            systemName: [config.systemName, Validators.required],
            shortDescription: [config.shortDescription],
            contactEmail: [config.contactEmail, [Validators.required, Validators.email]],
            whatsappNumber: [config.whatsappNumber, Validators.required],
            defaultLanguage: [config.defaultLanguage],
            timezone: [config.timezone],
            dateFormat: [config.dateFormat]
        });
    }

    ngOnInit(): void { }

    goBack() {
        this.router.navigate(['/admin/settings']);
    }

    onSubmit() {
        if (this.generalForm.valid) {
            this.configService.updateConfig('general', this.generalForm.value);
            console.log('General Settings Saved Persistent:', this.generalForm.value);
            // Visual feedback
            Swal.fire({
                icon: 'success',
                title: 'Ajustes Guardados',
                text: 'La configuración general se ha actualizado correctamente.',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}
