import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService, Patient } from 'src/app/core/services/patient.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  patientForm!: FormGroup;
  showAddForm = false;

  selectedPatient: any = null;
  selectedPatientId: number | null = null;

  viewMode: 'list' | 'details' = 'list';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
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
      address: [''],
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
    this.selectedPatientId = patient.id;
    this.showAddForm = true;
    this.patientForm.patchValue({
      name: patient.name,
      age: patient.age,
      city: patient.city,
      zone: patient.zone,
      diagnosis: patient.diagnosis,
      healthInsurance: patient.healthInsurance,
      address: patient.address,
      locationLink: patient.locationLink,
      status: patient.status
    });
  }

  savePatient() {
    if (this.patientForm.invalid) return;

    const data = this.patientForm.value;

    if (this.selectedPatientId) {
      const updatedPatient: any = {
        ...this.selectedPatient,
        ...data
      };

      this.patientService.updatePatient(this.selectedPatientId, updatedPatient).subscribe({
        next: () => {
          this.patientService.loadPatients();
          this.toggleAddMode();
          Swal.fire('¡Actualizado!', 'Paciente actualizado correctamente', 'success');
        },
        error: (err) => console.error('Error al actualizar', err)
      });
    } else {
      const newPatient: Patient = {
        ...data,
        medications: [],
        authorizedCaregivers: []
      };
      this.patientService.createPatient(newPatient).subscribe({
        next: () => {
          this.patientService.loadPatients();
          this.toggleAddMode();
          Swal.fire('¡Registrado!', 'Paciente guardado correctamente', 'success');
        },
        error: (err) => console.error('Error al crear', err)
      });
    }
  }

  deletePatient(id: number | undefined) {
    if (!id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer y eliminará permanentemente la ficha médica del paciente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.patientService.deletePatient(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El paciente ha sido borrado.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar', err);
            Swal.fire('Error', 'No se pudo eliminar el paciente. Posiblemente tenga servicios asociados.', 'error');
          }
        });
      }
    });
  }

  getMapsLink(p: any): string {
    if (!p) return '';

    if (typeof p === 'string') {
      if (p.startsWith('http://') || p.startsWith('https://')) return p;
      if (p.startsWith('www.')) return `https://${p}`;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p)}`;
    }

    if (p.locationLink && (p.locationLink.startsWith('http') || p.locationLink.startsWith('www.'))) {
      return p.locationLink.startsWith('www.') ? `https://${p.locationLink}` : p.locationLink;
    }

    const parts = [];
    if (p.address) parts.push(p.address);
    if (p.zone) parts.push(p.zone);
    if (p.city) parts.push(p.city);

    if (parts.length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
    }

    return '';
  }
}
