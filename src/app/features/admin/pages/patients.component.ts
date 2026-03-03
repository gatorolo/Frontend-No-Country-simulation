import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService, Patient } from 'src/app/core/services/patient.service';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  patientForm!: FormGroup;
  showAddForm = false;

  // Usamos any para que no chille por el ID que viene de la DB
  selectedPatient: any = null;
  selectedPatientId: number | null = null;

  viewMode: 'list' | 'details' = 'list';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    // Pedimos los datos a la API apenas carga el admin
    this.patientService.loadPatients();
    this.patientService.patients$.subscribe(p => this.patients = p);
    this.initForm();
  }

  initForm() {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      age: [0, [Validators.required, Validators.min(0)]],
      city: [''],
      zone: [''],
      diagnosis: ['', Validators.required],
      healthInsurance: ['', Validators.required],
      locationLink: [''],
      status: ['Activo', Validators.required]
    });
  }

  toggleAddMode() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.selectedPatient = null;
      this.selectedPatientId = null;
      this.patientForm.reset({ status: 'Activo' });
    }
  }

  viewDetails(patient: any) {
    this.selectedPatient = patient;
    this.viewMode = 'details';
  }

  closeDetails() {
    this.viewMode = 'list';
    this.selectedPatient = null;
  }

  editPatient(patient: any) {
    this.selectedPatient = patient;
    this.selectedPatientId = patient.id; // Guardamos el ID de la base de datos
    this.showAddForm = true;
    this.patientForm.patchValue({
      name: patient.name,
      age: patient.age,
      city: patient.city,
      zone: patient.zone,
      diagnosis: patient.diagnosis,
      healthInsurance: patient.healthInsurance,
      locationLink: patient.locationLink,
      status: patient.status
    });
  }

  savePatient() {
    if (this.patientForm.invalid) return;

    const data = this.patientForm.value;

    if (this.selectedPatientId) {
      // Caso EDITAR: Mandamos el ID y los datos por separado al servicio
      // Nos aseguramos de mezclar con los datos viejos
      const updatedPatient: any = {
        ...this.selectedPatient,
        ...data
      };

      // Enviamos ID como primer argumento y objeto como segundo
      this.patientService.updatePatient(this.selectedPatientId, updatedPatient).subscribe({
        next: () => {
          this.patientService.loadPatients();
          this.toggleAddMode();
        },
        error: (err) => console.error('Error al actualizar', err)
      });
    } else {
      // Caso NUEVO: El admin crea un paciente desde cero
      const newPatient: Patient = {
        ...data,
        medications: [],
        authorizedCaregivers: []
      };
      this.patientService.createPatient(newPatient).subscribe({
        next: () => {
          this.patientService.loadPatients();
          this.toggleAddMode();
        },
        error: (err) => console.error('Error al crear', err)
      });
    }
  }

  getMapsLink(link: string): string {
    if (!link) return '';
    // If it's already a full URL, trust it
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    // If it looks like a short link (www.something.com)
    if (link.startsWith('www.')) {
      return `https://${link}`;
    }
    // Otherwise, treat it as a raw street address and search Google Maps
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link)}`;
  }
}