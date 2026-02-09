import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-general-config',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {
    generalForm: FormGroup;

    constructor(private fb: FormBuilder, private router: Router) {
        this.generalForm = this.fb.group({
            systemName: ['Valora', Validators.required],
            shortDescription: ['Sistema de gestión y seguimiento.'],
            contactEmail: ['soporte@valora.com', [Validators.required, Validators.email]],
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
            console.log('General Settings Saved:', this.generalForm.value);
        }
    }
}
