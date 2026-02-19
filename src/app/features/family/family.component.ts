import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService, Patient } from 'src/app/core/services/patient.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-family-dashboard',
    templateUrl: './family.component.html',
    styleUrls: ['./family.component.css']
})
export class FamilyComponent implements OnInit {
    familyForm!: FormGroup;
    whatsappLink = '';
    currentPatientId = 1;

    // Mock Data for Caregivers
    availableCaregivers = [
        { id: 101, name: 'Lara Martínez', specialty: 'Enfermería' },
        { id: 102, name: 'Carlos Ruiz', specialty: 'Kinesiología' },
        { id: 103, name: 'Elena Paz', specialty: 'Cuidadora Geriátrica' },
        { id: 104, name: 'Carla Vuioner', specialty: 'Rehabilitación' }
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private configService: ConfigService,
        private patientService: PatientService

    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadPatientData();
        this.configService.whatsappNumber$.subscribe(num => {
            this.whatsappLink = `https://wa.me/${num}`;
        });
    }

    private loadPatientData() {
        // Llamamos al método que conecta con Java
        this.patientService.getPatientById(this.currentPatientId).subscribe({
            next: (patient) => {
                if (patient) {
                    // Limpiar medicaciones previas
                    while (this.medications.length) {
                        this.medications.removeAt(0);
                    }
                    // Cargar medicaciones desde la DB
                    patient.medications.forEach(m => {
                        this.medications.push(this.createMedicationGroup(m.name, m.schedule));
                    });

                    // Llenar el formulario con datos reales
                    this.familyForm.patchValue({
                        patientName: patient.name,
                        patientAge: patient.age,
                        diagnosis: patient.diagnosis,
                        healthInsurance: patient.healthInsurance,
                        locationLink: patient.locationLink,
                        authorizedCaregivers: patient.authorizedCaregivers
                    });
                }
            },
            error: (err) => console.error('Error cargando datos de Java:', err)
        });
    }

    private initForm() {
        this.familyForm = this.fb.group({
            // Ficha Médica
            patientName: ['Roberto Sánchez', Validators.required],
            patientAge: [78, [Validators.required, Validators.min(0)]],
            diagnosis: ['Alzheimer en etapa temprana e Hipertensión', Validators.required],
            healthInsurance: ['OSDE 310', Validators.required],
            locationLink: ['https://www.google.com/maps/place/Panader%C3%ADa+Artesanal+189/@-17.7932993,-63.1807397,18z/data=!4m15!1m8!3m7!1s0x915edf8977bba295:0x1c9ec2bb0115edbf!2sBolivia!3b1!8m2!3d-16.290154!4d-63.588653!16zL20vMDE2NXY!3m5!1s0x93f1e92101e9dfdb:0xc1dcd9b85c201702!8m2!3d-17.7933773!4d-63.1790827!16s%2Fg%2F11s5725zvn?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D', Validators.required],

            // Gestión de Medicación (FormArray)
            medications: this.fb.array([
                this.createMedicationGroup()
            ]),

            // Vinculación
            authorizedCaregivers: [[101], Validators.required]
        });
    }

    // Medication FormArray Helpers
    get medications(): FormArray {
        return this.familyForm.get('medications') as FormArray;
    }

    private createMedicationGroup(name: string = '', schedule: string = ''): FormGroup {
        return this.fb.group({
            name: [name, Validators.required],
            schedule: [schedule, Validators.required]
        });
    }

    addMedication() {
        this.medications.push(this.createMedicationGroup());
    }

    removeMedication(index: number) {
        this.medications.removeAt(index);
    }

    onSubmit() {
        if (this.familyForm.valid) {
            const formData = this.familyForm.value;
            const updatedPatient: Patient = {
                id: this.currentPatientId,
                name: formData.patientName,
                age: formData.patientAge,
                diagnosis: formData.diagnosis,
                healthInsurance: formData.healthInsurance,
                locationLink: formData.locationLink,
                medications: formData.medications,
                authorizedCaregivers: formData.authorizedCaregivers,
                status: 'Activo'
            };

            // EL CAMBIO ESTÁ AQUÍ:
            // Nos aseguramos de cerrar bien cada paréntesis y llave.
            this.patientService.updatePatient(updatedPatient).subscribe({
                next: (response) => {
                    console.log('✅ Guardado con éxito', response);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Cambios Guardados!',
                        text: 'La ficha médica ha sido actualizada correctamente.',
                        timer: 2000,
                        showConfirmButton: false,
                        background: '#f7f9fc',
                        color: '#0891b2'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/family/view']);
                    }, 2000);
                },
                error: (err) => {
                    console.error('❌ Error en la conexión con Java', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Conexión',
                        text: 'No se pudo conectar con el servidor de Java (backend). Verifica que el servicio esté activo.',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#0891b2',
                        background: '#f7f9fc',
                        color: '#ef4444'
                    });
                },
                complete: () => {
                    console.log('Petición completada');
                }
            });
        }
    }

    onCaregiverToggle(id: number) {
        // Al seleccionar un nuevo cuidador, reemplazamos el anterior para que solo haya uno.
        this.familyForm.patchValue({ authorizedCaregivers: [id] });
    }

    isCaregiverAuthorized(id: number): boolean {
        return (this.familyForm.get('authorizedCaregivers')?.value as number[]).includes(id);
    }
}
