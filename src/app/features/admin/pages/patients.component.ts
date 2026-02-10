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
  selectedPatient: Patient | null = null;
  viewMode: 'list' | 'details' = 'list';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.patientService.patients$.subscribe(p => this.patients = p);
    this.initForm();
  }

  initForm() {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      age: [0, [Validators.required, Validators.min(0)]],
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
      this.patientForm.reset({ status: 'Activo' });
    }
  }

  viewDetails(patient: Patient) {
    this.selectedPatient = patient;
    this.viewMode = 'details';
  }

  closeDetails() {
    this.viewMode = 'list';
    this.selectedPatient = null;
  }

  editPatient(patient: Patient) {
    this.selectedPatient = patient;
    this.showAddForm = true;
    this.patientForm.patchValue({
      name: patient.name,
      age: patient.age,
      diagnosis: patient.diagnosis,
      healthInsurance: patient.healthInsurance,
      locationLink: patient.locationLink,
      status: patient.status
    });
  }

  savePatient() {
    if (this.patientForm.invalid) return;

    const data = this.patientForm.value;
    if (this.selectedPatient && !this.showAddForm) {
      // Save logic
    } else if (this.selectedPatient) {
      this.patientService.updatePatient({
        ...this.selectedPatient,
        ...data
      });
    } else {
      const newPatient: Patient = {
        id: Date.now(),
        ...data,
        medications: [],
        authorizedCaregivers: []
      };
      this.patientService.addPatient(newPatient);
    }
    this.toggleAddMode();
  }
}
