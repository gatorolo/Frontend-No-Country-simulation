import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { ConfigService } from 'src/app/core/services/config.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { ProfileService } from 'src/app/core/services/profile.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-caregiver-dashboard',
    templateUrl: './caregiver.component.html',
    styleUrls: ['./caregiver.component.css']
})
export class CaregiverComponent implements OnInit {
    activeTab: 'activity' | 'profile' | 'history' = 'activity';
    isShiftActive = false;
    shiftDuration = '00:00:00';
    shiftForm!: FormGroup;
    whatsappLink = '';
    posts: any[] = [];

    // Static data for the professional profile
    profileData: any = {
        id: null,
        caregiverName: '',
        dni: '',
        phone: '',
        city: '',
        address: '',
        hourlyRate: 0,
        specialty: '',
        status: ''
    };

    patients: any[] = [];

    shiftHistory: any[] = [];
    private shiftSeconds = 0;

    // Nueva propiedad para mostrar info del paciente en la UI
    selectedPatientDetails: any = null;

    private timerInterval: any;

    notifications: any[] = [];
    unreadCount = 0;
    showNotifications = false;
    caregiverForm!: FormGroup;
    showModal: boolean = false;
    showProfileModal: boolean = false;
    uploadingPhoto: boolean = false;


    constructor(
        private fb: FormBuilder,
        private configService: ConfigService,
        private matchingService: MatchingService,
        private caregiverService: CaregiverService,
        private notificationService: NotificationService,
        private patientService: PatientService,
        private profileService: ProfileService
    ) { }

    clearedPostIds: number[] = [];
    hiddenShiftIds: number[] = [];
    caregiverDocuments: any[] = [];

    ngOnInit(): void {
        this.loadClearedPostIds();
        this.loadHiddenShiftIds();
        this.initShiftForm();
        this.loadProfile();
        this.initCaregiverForm();
        this.loadShiftHistory(); // Carga el historial real de la base de datos
        this.checkActiveShift(); // IMPORTANTE: Recuperar guardia en curso si existe
        this.loadDocuments(); // Cargar documentos del cuidador

        // 1. Configuración de WhatsApp
        this.configService.config$.subscribe(config => {
            this.whatsappLink = `https://wa.me/${config.general.whatsappNumber}`;
        });

        // Cargar Pacientes reales desde BD en vez del mock
        this.patientService.patients$.subscribe(data => {
            this.patients = data;
            // Si hay una guardia activa, re-sincronizamos el formulario para mostrar los datos del paciente
            if (this.isShiftActive) {
                this.checkActiveShift();
            }
        });

        // 2. Suscripción a Notificaciones (La que maneja la campanita)
        this.notificationService.notifications$.subscribe(allNotifs => {
            // Filtramos solo las que son para el CUIDADOR
            const caregiverNotifs = allNotifs.filter(n => n.recipientRole === 'caregiver');

            // Manejo del contador de no leídos
            const unread = caregiverNotifs.filter(n => !n.read).length;
            this.unreadCount = unread;

            this.notifications = caregiverNotifs;
            console.log('🔔 Notificaciones del Service actualizadas:', this.notifications);

        });

        this.matchingService.posts$.subscribe(posts => {
            this.posts = posts;
        });
    }



    loadProfile() {
        const userId = this.profileService.getUserId() || 1;
        this.caregiverService.getCaregiverById(userId).subscribe({
            next: (data) => {
                // Mapeo robusto: Java a veces devuelve 'name' y el front usa 'fullName'
                this.profileData = data;
                console.log('✅ Perfil cargado correctamente:', this.profileData);

                // Si usas un formulario para el perfil, actualízalo aquí
                if (this.caregiverForm && data) {
                    this.caregiverForm.patchValue(data);
                }
            },
            error: (err) => console.error('❌ Error al cargar el perfil:', err)
        });
    }

    private loadClearedPostIds() {
        const saved = localStorage.getItem('valora_cleared_posts');
        if (saved) {
            try {
                this.clearedPostIds = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading cleared posts', e);
            }
        }
    }

    private saveClearedPostIds() {
        localStorage.setItem('valora_cleared_posts', JSON.stringify(this.clearedPostIds));
    }

    private loadHiddenShiftIds() {
        const saved = localStorage.getItem('valora_hidden_shifts');
        if (saved) {
            try {
                this.hiddenShiftIds = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading hidden shifts', e);
            }
        }
    }

    private saveHiddenShiftIds() {
        localStorage.setItem('valora_hidden_shifts', JSON.stringify(this.hiddenShiftIds));
    }


    closeModal() {
        this.showModal = false;
        this.showProfileModal = false;
    }

    openEditProfileModal() {
        this.caregiverForm.patchValue({
            caregiverName: this.profileData.caregiverName,
            dni: this.profileData.dni,
            phone: this.profileData.phone,
            address: this.profileData.address,
            city: this.profileData.city,
            hourlyRate: this.profileData.hourlyRate,
            specialty: this.profileData.specialty,
            status: this.profileData.status

        });
        this.showProfileModal = true;
    }

    saveProfile() {
        if (this.caregiverForm.invalid) return;

        const caregiverId = this.profileData?.id || this.profileService.getUserId();
        const formValues = this.caregiverForm.value;

        const payload = {
            ...this.profileData,       // Trae ID y otros campos
            ...formValues,             // Trae caregiverName, city, etc.
            // FORZAMOS LA SINCRONIZACIÓN:
            caregiverName: formValues.caregiverName,
            fullName: formValues.caregiverName, // Enviamos el mismo valor a ambas columnas por si acaso
            status: this.profileData.status || 'Activo'
        };

        console.log('enviando payload:', payload);

        this.caregiverService.updateCaregiver(caregiverId, payload).subscribe({
            next: (res: any) => {
                // Actualizamos la vista con lo que devuelve el servidor
                this.profileData = {
                    ...res,
                    caregiverName: res.caregiverName || res.fullName // Mapeo de seguridad
                };
                this.closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Perfil actualizado',
                    text: 'Los datos se han guardado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (err) => console.error('Error al guardar:', err)
        });
    }


    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        if (this.showNotifications) {
            this.unreadCount = 0;
        }
    }

    removeNotification(event: Event, id: number) {
        event.stopPropagation();
        if (!this.clearedPostIds.includes(id)) {
            this.clearedPostIds.push(id);
            this.saveClearedPostIds();
        }
        // Llamada al service para persistencia real
        this.notificationService.removeNotification(id);
    }

    clearAllNotifications() {
        // 1. Borramos permanentemente del LocalStorage para el rol de cuidador
        this.notificationService.clearByRole('caregiver');

        // 2. Opcional: También podrías limpiar la variable local por seguridad
        this.notifications = [];
        this.unreadCount = 0;

        console.log('🧹 Notificaciones borradas permanentemente');
    }

    selectedNotification: any = null;

    openNotificationDetail(n: any) {
        // Buscamos el post real para alimentar el modal detallado
        const postReal = this.posts.find(p => p.id === n.relatedPostId);

        if (postReal) {
            this.selectedNotification = { ...postReal }; // Clonar para evitar mutar el origen
        } else {
            this.selectedNotification = { ...n }; // Fallback a la notificación
        }

        // --- NUEVO: Extraer Dirección de la Base de Pacientes ---
        if (this.selectedNotification.patientName) {
            const patientData = this.patients.find(
                p => p.name?.trim().toLowerCase() === this.selectedNotification.patientName.trim().toLowerCase()
            );

            if (patientData) {
                this.selectedNotification.locationLink = patientData.locationLink;
                // Si el paciente no tiene ciudad, usamos su zona
                this.selectedNotification.city = patientData.city || patientData.zone || 'No especificada';
                // Si no hay dirección guardada (que no la hay en el schema actual de Patient), usamos una descripción clara
                this.selectedNotification.address = patientData.city ? `${patientData.city}, ${patientData.zone || ''}` : 'Ubicación de servicio';
            }
        }
        // --------------------------------------------------------

        this.showNotifications = false;

        // Persistimos el estado de "leído"
        this.notificationService.markAsRead(n.id);
    }



    closeNotificationDetail() {
        this.selectedNotification = null;
    }

    applyToService() {
        if (!this.selectedNotification) return;

        const postId = this.selectedNotification.id;
        const caregiverName = this.profileData?.caregiverName || this.profileData?.fullName || this.profileData?.name || 'Cuidador';
        const caregiverId = this.profileData?.id || this.profileService.getUserId();

        console.log('🚀 Postulando a:', caregiverName);

        this.matchingService.applyToPost(postId, caregiverId, caregiverName).subscribe({
            next: (response: any) => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Postulación enviada!',
                    text: 'El administrador revisará tu solicitud',
                    confirmButtonColor: '#0ea5e9'
                });

                // Notificación para el ADMIN
                this.notificationService.addNotification({
                    title: 'Nueva Postulación',
                    // Aquí usamos la variable que ya tiene el nombre real
                    message: `El cuidador ${caregiverName} se ha postulado para el servicio de ${this.selectedNotification.patientName}.`,
                    type: 'success',
                    recipientRole: 'admin',
                    relatedPostId: postId,
                    // Metadatos extra para que el Admin tenga info aunque el polling falle
                    patientName: this.selectedNotification.patientName,
                    caregiverName: caregiverName,
                    caregiverId: caregiverId,
                    age: this.selectedNotification.age,
                    zone: this.selectedNotification.zone,
                    city: this.selectedNotification.city,
                    schedule: this.selectedNotification.schedule,
                    specialty: this.selectedNotification.specialty,
                    complexity: this.selectedNotification.complexity
                } as any);

                this.closeNotificationDetail();
            },
            error: (err: any) => {
                console.error("Error al postularse:", err);
            }
        });
    }
    private initShiftForm() {
        this.shiftForm = this.fb.group({
            patientId: ['', Validators.required],
            startTimeInput: ['', Validators.required],
            notes: ['']
        });

        // Escuchar cambios en el selector de paciente para mostrar su información 
        this.shiftForm.get('patientId')?.valueChanges.subscribe(id => {
            if (id) {
                // Usamos == para comparar string vs number de forma segura
                const patientReal = this.patients.find(p => p.id == id);
                if (patientReal) {
                    this.selectedPatientDetails = {
                        ...patientReal,
                        city: patientReal.city || 'No especificada',
                        zone: patientReal.zone || 'No especificada'
                    };
                } else {
                    this.selectedPatientDetails = null;
                }
            } else {
                this.selectedPatientDetails = null;
            }
        });
    }


    private initCaregiverForm() {
        this.caregiverForm = this.fb.group({
            caregiverName: [this.profileData.caregiverName || '', Validators.required],
            dni: [this.profileData.dni || '', Validators.required],
            phone: [this.profileData.phone || ''],
            city: [this.profileData.city || '', Validators.required],
            specialty: [this.profileData.specialty || '', Validators.required],
            hourlyRate: [this.profileData.hourlyRate || 0, [Validators.required, Validators.min(1)]],
            address: [this.profileData.address || ''],
            paymentTarget: [this.profileData.paymentTarget || '', Validators.required]
        });
    }

    setTab(tab: 'activity' | 'profile' | 'history') {
        this.activeTab = tab;
    }


    toggleShift() {
        if (!this.isShiftActive) {
            this.startShift();
        } else {
            this.stopShift();
        }
    }

    private startShift() {
        const patientName = this.patients.find(p => p.id === +this.shiftForm.value.patientId)?.name || 'Desconocido';
        const caregiverId = this.profileData?.id || this.profileService.getUserId();

        const payload = {
            caregiverId: caregiverId,
            patientName: patientName
        };

        this.caregiverService.startShift(payload).subscribe({
            next: (res) => {
                this.isShiftActive = true;
                this.shiftSeconds = 0;

                if (this.timerInterval) clearInterval(this.timerInterval);
                this.timerInterval = setInterval(() => {
                    this.shiftSeconds++;
                    const hrs = Math.floor(this.shiftSeconds / 3600);
                    const mins = Math.floor((this.shiftSeconds % 3600) / 60);
                    const secs = this.shiftSeconds % 60;
                    this.shiftDuration = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
                }, 1000);

                // Opción: Notificar al usuario que la guardia inició en servidor
                console.log('Guardia iniciada en backend:', res);
            },
            error: (err) => {
                console.error('Error al iniciar guardia en backend', err);
                Swal.fire('Error', 'No se pudo iniciar la guardia en el servidor. Revisa tu conexión u otra guardia activa.', 'error');
            }
        });
    }

    private stopShift() {
        clearInterval(this.timerInterval);
        this.isShiftActive = false;

        const caregiverId = this.profileData?.id || this.profileService.getUserId();

        const payload = {
            caregiverId: caregiverId,
            durationSeconds: this.shiftSeconds
        };

        Swal.fire({
            title: 'Procesando pago...',
            text: 'Calculando el total de la guardia',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        this.caregiverService.stopShift(payload).subscribe({
            next: (res) => {
                Swal.close();
                Swal.fire({
                    icon: 'success',
                    title: 'Guardia Finalizada',
                    text: `Ganancia calculada: $${res.earned.toFixed(2)}`,
                    confirmButtonText: 'Aceptar'
                });
                this.shiftForm.reset();
                this.shiftDuration = '00:00:00';
                this.shiftSeconds = 0;
                this.loadShiftHistory(); // Refresca el historial
            },
            error: (err) => {
                Swal.close();
                console.error('Error al finalizar guardia', err);
                Swal.fire('Error', 'No se pudo registrar la guardia', 'error');
            }
        });
    }

    private checkActiveShift() {
        const caregiverId = this.profileData?.id || this.profileService.getUserId();
        this.caregiverService.getActiveShifts().subscribe({
            next: (shifts) => {
                const myActiveShift = shifts.find(s => s.caregiverId === caregiverId && s.status === 'ACTIVA');
                if (myActiveShift) {
                    this.isShiftActive = true;
                    // Calcular los segundos que pasaron desde que inició en el servidor
                    const startDate = new Date(myActiveShift.startTime);
                    const now = new Date().getTime();
                    this.shiftSeconds = Math.floor((now - startDate.getTime()) / 1000);
                    if (this.shiftSeconds < 0) this.shiftSeconds = 0;

                    // Sincronizar UI Form
                    const timeString = `${this.pad(startDate.getHours())}:${this.pad(startDate.getMinutes())}`;

                    const syncFormTask = () => {
                        const normalize = (str: string) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
                        const syncName = normalize(myActiveShift.patientName);

                        const patientObj = this.patients.find(p => normalize(p.name) === syncName);

                        console.log('🔍 Intentando sincronizar paciente:', syncName, 'Encontrado:', patientObj?.name);

                        if (patientObj) {
                            // Asignación directa para evitar depender solo del evento reactivo
                            this.selectedPatientDetails = {
                                ...patientObj,
                                city: patientObj.city || 'No especificada',
                                zone: patientObj.zone || 'No especificada'
                            };

                            this.shiftForm.patchValue({
                                patientId: patientObj.id,
                                startTimeInput: timeString
                            }, { emitEvent: false }); // Ya lo asignamos arriba, no hace falta disparar evento
                        }
                    };

                    // En caso de que la lista de pacientes tarde unos milisegundos más en cargar
                    if (this.patients && this.patients.length > 0) {
                        syncFormTask();
                    } else {
                        // Si no hay pacientes aún, la suscripción a patients$ se encargará de re-sincronizar
                        console.log('⏳ Esperando carga de pacientes para sincronizar guardia activa...');
                    }

                    // Reanudar el reloj localmente
                    if (this.timerInterval) clearInterval(this.timerInterval);
                    this.timerInterval = setInterval(() => {
                        this.shiftSeconds++;
                        const hrs = Math.floor(this.shiftSeconds / 3600);
                        const mins = Math.floor((this.shiftSeconds % 3600) / 60);
                        const secs = this.shiftSeconds % 60;
                        this.shiftDuration = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
                    }, 1000);
                }
            },
            error: (err) => console.error('Error al recuperar estado de guardia actual', err)
        });
    }

    private loadShiftHistory() {
        const caregiverId = this.profileData?.id || this.profileService.getUserId();
        this.caregiverService.getShiftHistory(caregiverId).subscribe({
            next: (history) => {
                // Formateamos para que funcione con el HTML actual y filtramos los ocultos
                this.shiftHistory = history
                    .filter(h => !this.hiddenShiftIds.includes(h.id))
                    .map(h => {
                        const dateObj = new Date(h.endTime);
                        return {
                            id: h.id,
                            patient: h.patientName,
                            date: dateObj.toLocaleDateString(),
                            duration: h.durationHours ? h.durationHours.toFixed(2) + ' hs' : '0 hs',
                            earned: h.earned
                        };
                    });
            },
            error: (err) => console.error('Error cargando historial de guardias', err)
        });
    }

    hideShift(shiftId: number) {
        Swal.fire({
            title: '¿Ocultar registro?',
            text: 'Este registro ya no será visible en tu historial, pero no se borrará del sistema admin.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ocultar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                if (!this.hiddenShiftIds.includes(shiftId)) {
                    this.hiddenShiftIds.push(shiftId);
                    this.saveHiddenShiftIds();
                    this.loadShiftHistory(); // Recargar la tabla sin este registro

                    Swal.fire(
                        'Oculto',
                        'El registro ha sido removido de tu vista.',
                        'success'
                    );
                }
            }
        });
    }

    private pad(num: number): string {
        const abs = Math.abs(num);
        return abs < 10 ? '0' + abs : abs.toString();
    }

    loadDocuments() {
        const userId = this.profileService.getUserId() || 1;
        this.caregiverService.getCaregiverDocuments(userId).subscribe({
            next: (docs) => this.caregiverDocuments = docs,
            error: (err) => console.error('Error loading documents:', err)
        });
    }

    getDocumentByType(type: string) {
        return this.caregiverDocuments.find(d => d.type === type);
    }

    onFileUpload(event: any, docType: string) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64 = e.target.result;
            const userId = this.profileData?.id || this.profileService.getUserId();
            const caregiverName = this.profileData?.caregiverName || 'Cuidador';

            const payload = {
                caregiverId: userId,
                caregiverName: caregiverName,
                type: docType,
                fileName: file.name,
                content: base64
            };

            Swal.fire({
                title: 'Subiendo documento...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            this.caregiverService.uploadDocument(payload).subscribe({
                next: () => {
                    Swal.fire('¡Éxito!', 'Documento subido correctamente', 'success');
                    this.loadDocuments();
                },
                error: (err) => {
                    console.error('Error uploading document:', err);
                    Swal.fire('Error', 'No se pudo subir el documento', 'error');
                }
            });
        };
        reader.readAsDataURL(file);
    }

    uploadProfilePhoto(event: any) {
        const file = event.target.files[0];
        if (!file || !this.profileData?.id) return;

        this.uploadingPhoto = true;
        const reader = new FileReader();

        reader.onload = (e: any) => {
            const base64 = e.target.result as string;

            // Send exactly the same payload used in saveProfile, plus the new photo
            const payload = {
                ...this.profileData,
                profilePhoto: base64
            };

            this.caregiverService.updateCaregiver(this.profileData.id, payload).subscribe({
                next: (res: any) => {
                    this.uploadingPhoto = false;
                    // Update the active UI so the modal displays the new image smoothly
                    this.profileData = {
                        ...res,
                        caregiverName: res.caregiverName || res.fullName
                    };

                    Swal.fire({
                        icon: 'success',
                        title: 'Foto Actualizada',
                        text: 'Tu foto de perfil se guardó correctamente',
                        timer: 2000,
                        showConfirmButton: false
                    });
                },
                error: (err) => {
                    this.uploadingPhoto = false;
                    console.error('Error al subir foto:', err);
                    Swal.fire('Error', 'No pudimos procesar la imagen', 'error');
                }
            });
        };

        reader.readAsDataURL(file);
    }

    getMapsLink(link: string): string {
        if (!link) return '';
        if (link.startsWith('http://') || link.startsWith('https://')) {
            return link;
        }
        if (link.startsWith('www.')) {
            return `https://${link}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link)}`;
    }
}
