import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';

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
        this.generalForm = this.fb.group({
            systemName: ['Valora', Validators.required],
            shortDescription: ['Sistema de gestión y seguimiento.'],
            contactEmail: ['soporte@valora.com', [Validators.required, Validators.email]],
            whatsappNumber: [this.configService.getWhatsAppNumber(), Validators.required],
            defaultLanguage: ['es'],
            timezone: ['GMT-3'],
            dateFormat: ['DD/MM/YYYY']
        });
    }

    ngOnInit(): void { }

    goBack() {
        this.router.navigate(['/admin/settings']);
    }

    onSubmit() {
        if (this.generalForm.valid) {
            const { whatsappNumber } = this.generalForm.value;
            this.configService.setWhatsAppNumber(whatsappNumber);
            console.log('General Settings Saved:', this.generalForm.value);
        }
    }
}
