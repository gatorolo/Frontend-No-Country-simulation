import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CaregiverService } from '../../../core/services/caregiver.service';
import { MatchingService } from '../../../core/services/matching.service';
import Swal from 'sweetalert2';

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
      caregiverName: ['', Validators.required],
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
      caregiverName: cg.caregiverName,
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
          Swal.fire('¡Éxito!', 'Cuidador actualizado correctamente', 'success');
          this.loadCaregivers(); // Refrescamos la lista
          this.toggleAddMode();
        },
        error: (err) => {
          console.error('Error al actualizar', err);
          Swal.fire('Error', 'No se pudo actualizar el cuidador', 'error');
        }
      });

    } else {
      // --- MODO CREACIÓN (POST) ---
      const newCg = { ...data }; // Java se encargará de generar el ID real

      this.caregiverService.addCaregiver(newCg).subscribe({
        next: (res) => {
          console.log('✅ Cuidador guardado en DB Java', res);
          Swal.fire('¡Éxito!', 'Cuidador registrado correctamente', 'success');
          this.loadCaregivers(); // Refrescamos la lista
          this.toggleAddMode();
        },
        error: (err) => {
          console.error('Error al guardar en Java', err);
          Swal.fire('Error', 'No se pudo conectar con el servidor Java', 'error');
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

  deleteCaregiver(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.caregiverService.deleteCaregiver(id).subscribe({
          next: () => {
            console.log('✅ Cuidador eliminado');
            Swal.fire('Eliminado', 'El cuidador ha sido eliminado.', 'success');
            this.loadCaregivers();
          },
          error: (err) => {
            console.error('Error al eliminar', err);
            Swal.fire('Error', 'No se pudo eliminar el cuidador. Es posible que tenga servicios asociados.', 'error');
          }
        });
      }
    });
  }

  // Agregamos este método para traer los datos reales al iniciar
  private loadCaregivers() {
    this.caregiverService.getAllCaregivers().subscribe(data => {
      this.caregivers = data;
    });
  }
}