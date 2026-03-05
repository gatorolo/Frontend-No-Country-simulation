import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService, Patient } from 'src/app/core/services/patient.service';
import { MatchingService, ServicePost } from 'src/app/core/services/matching.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-family-dashboard',
    templateUrl: './family.component.html',
    styleUrls: ['./family.component.css']
})
export class FamilyComponent implements OnInit {
    familyForm!: FormGroup;
    whatsappLink = '';
    currentPatientId: number | null = null;

    availableCaregivers: any[] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private configService: ConfigService,
        private patientService: PatientService,
        private matchingService: MatchingService, // Inyectamos MatchingService
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.configService.config$.subscribe(config => {
            const num = config.general.whatsappNumber;
            this.whatsappLink = `https://wa.me/${num}`;
        });

        this.route.paramMap.subscribe(params => {
            const idParam = params.get('id');
            if (idParam !== null) {
                const idVal = parseInt(idParam, 10);
                this.currentPatientId = idVal;
                this.cargarDatosParaEditar(idVal);
            } else {
                this.currentPatientId = null;
            }
        });

        // Suscripción para integrar cuidadores reales confirmados
        this.syncRealCaregivers();
    }

    private syncRealCaregivers() {
        this.matchingService.posts$.subscribe((posts: ServicePost[]) => {
            if (!posts) return;

            const confirmedPosts = posts.filter((p: ServicePost) => p.status === 'Confirmado');

            confirmedPosts.forEach((post: ServicePost) => {
                // 1. Verificamos si el cuidador ya está en la lista (evitar duplicados)
                const exists = this.availableCaregivers.some(cg => cg.id === post.caregiverId);

                if (!exists && post.caregiverId && post.caregiverName) {
                    // 2. Lo agregamos a la lista visible (El "Cuidador Designado" que pidió el usuario)
                    this.availableCaregivers.push({
                        id: post.caregiverId,
                        fullName: post.caregiverName,
                        specialty: post.specialty || 'Especialista Asignado'
                    });
                }

                // 3. Si el post pertenece al paciente actual, lo autorizamos automáticamente en el form
                // Hacemos un match por nombre ya que es el dato que tenemos en el post y el form
                const currentName = this.familyForm.get('patientName')?.value?.toLowerCase();
                const postPatientName = post.patientName?.toLowerCase();

                if (currentName && postPatientName && (currentName.includes(postPatientName) || postPatientName.includes(currentName))) {
                    const currentAuthorized = this.familyForm.get('authorizedCaregivers')?.value || [];
                    if (post.caregiverId && !currentAuthorized.includes(post.caregiverId)) {
                        this.familyForm.patchValue({
                            authorizedCaregivers: [...currentAuthorized, post.caregiverId]
                        });
                    }
                }
            });
        });
    }

    cargarDatosParaEditar(id: number) {
        if (!id) return;

        this.patientService.getPatientById(id).subscribe({
            next: (patient: any) => {
                this.familyForm.patchValue({
                    patientName: patient.name,
                    patientAge: patient.age,
                    diagnosis: patient.diagnosis,
                    healthInsurance: patient.healthInsurance,
                    locationLink: patient.locationLink,
                    city: patient.city,
                    zone: patient.zone,
                    address: patient.address,
                    authorizedCaregivers: patient.authorizedCaregivers || []
                });

                if (patient.medications) {
                    this.cargarMedicaciones(patient.medications);
                }

                // Re-ejecutamos el sync por si cargamos el nombre después de los posts
                this.syncRealCaregivers();
            },
            error: (err) => console.error('Error al cargar datos:', err)
        });
    }

    cargarMedicaciones(medications: any[]) {
        const control = this.medications;


        while (control.length !== 0) {
            control.removeAt(0);
        }


        medications.forEach(med => {
            control.push(this.createMedicationGroup(med.name, med.schedule));
        });
    }
    private loadPatientData() {

        if (this.currentPatientId === null) {
            console.warn('No hay ID para cargar datos');
            return;
        }


        this.patientService.getPatientById(this.currentPatientId).subscribe({
            next: (patient) => {
                if (patient) {

                    while (this.medications.length) {
                        this.medications.removeAt(0);
                    }


                    patient.medications.forEach(m => {
                        this.medications.push(this.createMedicationGroup(m.name, m.schedule));
                    });


                    this.familyForm.patchValue({
                        patientName: patient.name,
                        patientAge: patient.age,
                        diagnosis: patient.diagnosis,
                        healthInsurance: patient.healthInsurance,
                        locationLink: patient.locationLink,
                        city: patient.city,
                        zone: patient.zone,
                        address: patient.address,
                        authorizedCaregivers: patient.authorizedCaregivers
                    });
                }
            },
            error: (err) => console.error('Error cargando datos de Java:', err)
        });
    }

    private initForm() {
        this.familyForm = this.fb.group({

            patientName: ['', Validators.required],
            patientAge: [null, [Validators.required, Validators.min(0)]],
            diagnosis: ['', Validators.required],
            healthInsurance: ['', Validators.required],
            locationLink: [''],
            city: [''],
            zone: [''],
            address: [''],

            medications: this.fb.array([]),
            authorizedCaregivers: [[]]
        });
    }


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
            const patientData: any = {
                name: formData.patientName,
                age: formData.patientAge,
                diagnosis: formData.diagnosis,
                healthInsurance: formData.healthInsurance,
                locationLink: formData.locationLink,
                city: formData.city,
                zone: formData.zone,
                address: formData.address,
                medications: formData.medications || [],
                authorizedCaregivers: formData.authorizedCaregivers,
                status: 'Pendiente'
            };

            if (this.currentPatientId) {
                console.log('🚀 Intentando guardar paciente ID:', this.currentPatientId);
                this.patientService.updatePatient(this.currentPatientId, patientData).subscribe({
                    next: (res) => {
                        console.log('✅ Paciente actualizado con éxito');
                        this.ejecutarNavegacionExitosa(this.currentPatientId!);
                    },
                    error: (err) => {
                        console.warn('⚠️ Falló la actualización (posiblemente ID no existe), intentando crear...', err);

                        this.patientService.createPatient({ ...patientData, id: this.currentPatientId! }).subscribe({
                            next: (res) => {
                                console.log('✅ Paciente creado con éxito (ID 23 forzado)');
                                this.ejecutarNavegacionExitosa(this.currentPatientId!);
                            },
                            error: (errCreate) => console.error('❌ Error crítico al crear:', errCreate)
                        });
                    }
                });
            } else {

                console.log('📝 Creando nuevo paciente');
                this.patientService.createPatient(patientData).subscribe({
                    next: (res) => {
                        console.log('✅ Nuevo paciente creado con éxito');
                        this.ejecutarNavegacionExitosa(res.id || 1);
                    },
                    error: (err) => console.error('❌ Error al crear:', err)
                });
            }

        } else {
            // Lógica de formulario inválido
            console.warn('Formulario no válido');
            alert('Por favor, completa los campos obligatorios.');
        }
    }

    onCaregiverToggle(id: number) {
        const current = this.familyForm.get('authorizedCaregivers')?.value || [];
        let updated: number[];

        if (current.includes(id)) {
            updated = current.filter((c: number) => c !== id);
        } else {
            updated = [...current, id];
        }

        this.familyForm.patchValue({ authorizedCaregivers: updated });
    }

    selectAllCaregivers() {
        const allIds = this.availableCaregivers.map(cg => cg.id);
        this.familyForm.patchValue({ authorizedCaregivers: allIds });
    }

    deselectAllCaregivers() {
        this.familyForm.patchValue({ authorizedCaregivers: [] });
    }

    isCaregiverAuthorized(id: number): boolean {
        const authorized = this.familyForm.get('authorizedCaregivers')?.value;
        return Array.isArray(authorized) && authorized.includes(id);
    }

    // Navegar siempre (optimista), el backend sincroniza en segundo plano
    private ejecutarNavegacionExitosa(id: number) {
        Swal.fire({
            icon: 'success',
            title: '¡Cambios Guardados!',
            text: 'La ficha médica ha sido actualizada correctamente.',
            timer: 1500,
            showConfirmButton: false,
            background: '#f7f9fc',
            color: '#0891b2'
        }).then(() => {
            console.log('SweetAlert cerrado, intentando navegar a /family/view/', id);
            this.router.navigate(['/family/view', id])
                .then(success => {
                    if (success) console.log('Navegación exitosa a ID:', id);
                    else console.warn('Navegación fallida');
                })
                .catch(err => console.error('Error crítico en navegación:', err));
        });
    }
}