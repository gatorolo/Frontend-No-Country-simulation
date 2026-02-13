import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-caregivers',
  templateUrl: './caregivers.component.html',
  styleUrls: ['./caregivers.component.css']
})
export class CaregiversComponent implements OnInit {
  caregiverForm!: FormGroup;
  showAddForm = false;
  selectedCaregiver: any = null;

  caregivers: any[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.caregiverForm = this.fb.group({
      fullName: ['', Validators.required],
      specialty: ['', Validators.required],
      dni: ['', Validators.required],
      phone: ['', Validators.required],
      hourlyRate: [0, [Validators.required, Validators.min(0)]],
      status: ['Pendiente', Validators.required]
    });
  }

  toggleAddMode() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.selectedCaregiver = null;
      this.caregiverForm.reset({ status: 'Pendiente' });
    }
  }

  editCaregiver(cg: any) {
    this.selectedCaregiver = cg;
    this.showAddForm = true;
    this.caregiverForm.patchValue({
      fullName: cg.fullName,
      specialty: cg.specialty,
      dni: cg.dni,
      phone: cg.phone,
      hourlyRate: cg.hourlyRate,
      status: cg.status
    });
  }

  saveCaregiver() {
    if (this.caregiverForm.invalid) return;

    const data = this.caregiverForm.value;
    if (this.selectedCaregiver) {
      const index = this.caregivers.findIndex(c => c.id === this.selectedCaregiver.id);
      this.caregivers[index] = { ...this.selectedCaregiver, ...data };
    } else {
      const newCg = {
        id: Date.now(),
        ...data
      };
      this.caregivers.unshift(newCg);
    }
    this.toggleAddMode();
  }
}
