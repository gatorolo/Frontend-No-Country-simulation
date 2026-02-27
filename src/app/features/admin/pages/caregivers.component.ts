import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CaregiverService } from '../../../core/services/caregiver.service';
import { MatchingService } from '../../../core/services/matching.service';

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

  constructor(private fb: FormBuilder, private caregiverService: CaregiverService, private matchingService: MatchingService) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCaregivers(); // ← carga desde la BD al iniciar
    this.matchingService.loadPosts().subscribe();
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
      // --- MODO EDICIÓN (PUT) ---
      const updatedCg = { ...this.selectedCaregiver, ...data };

      // Asumiendo que agregamos updateCaregiver al servicio
      this.caregiverService.addCaregiver(updatedCg).subscribe({
        next: (res) => {
          console.log('✅ Cuidador actualizado en Java', res);
          this.loadCaregivers(); // Refrescamos la lista
          this.toggleAddMode();
        },
        error: (err) => console.error('Error al actualizar', err)
      });

    } else {
      // --- MODO CREACIÓN (POST) ---
      const newCg = { ...data }; // Java se encargará de generar el ID real

      this.caregiverService.addCaregiver(newCg).subscribe({
        next: (res) => {
          console.log('✅ Cuidador guardado en DB Java', res);
          this.loadCaregivers(); // Refrescamos la lista
          this.toggleAddMode();
        },
        error: (err) => {
          console.error('Error al guardar en Java', err);
          alert('No se pudo conectar con el servidor Java');
        }
      });
    }
  }

  toggleVerification(cg: any) {
    const newStatus = cg.status === 'Verificado' ? 'Falta verificar' : 'Verificado';
    const updatedCg = { ...cg, status: newStatus };

    this.caregiverService.updateCaregiver(cg.id, updatedCg).subscribe({
      next: () => {
        this.loadCaregivers();
      },
      error: (err) => console.error('Error al cambiar estado', err)
    });
  }

  // Agregamos este método para traer los datos reales al iniciar
  private loadCaregivers() {
    this.caregiverService.getAllCaregivers().subscribe(data => {
      this.caregivers = data;
    });
  }
}