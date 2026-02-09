import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-apariencia-config',
  templateUrl: './apariencia.component.html',
  styleUrls: ['./apariencia.component.css']
})
export class AparienciaComponent {
  appearanceForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.appearanceForm = this.fb.group({
      darkMode: [false],
      primaryColor: ['#dfe4ec'],
      showLogoInSidebar: [true]
    });
  }

  goBack() {
    this.router.navigate(['/admin/settings']);
  }

  onSubmit() {
    console.log('Appearance Settings Saved:', this.appearanceForm.value);
  }

  onFileUpload(event: any, type: string) {
    console.log(`Uploading ${type}...`, event.target.files[0]);
  }
}
