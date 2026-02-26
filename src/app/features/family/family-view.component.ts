import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-family-view',
  templateUrl: './family-view.component.html',
  styleUrls: ['./family-view.component.css']
})
export class FamilyViewComponent implements OnInit {
  whatsappLink = '';
  patientData: any = null;
  currentPatientId = 1;
  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;
  isLoading = true;
  errorMessage = '';
  private pendingCaregiver: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private patientService: PatientService,
    private matchingService: MatchingService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // 1. WhatsApp Link
    this.configService.config$.subscribe(config => {
      this.whatsappLink = `https://wa.me/${config.general.whatsappNumber}`;
    });

    // 2. Escuchar el ID de la URL y Cargar Datos de forma robusta
    this.route.paramMap.pipe(
      tap(params => {
        this.isLoading = true;
        this.errorMessage = '';
        const idParam = params.get('id');
        if (idParam) {
          this.currentPatientId = Number(idParam);
          this.fetchPatientData(this.currentPatientId);
        } else {
          // Fallback si no hay ID en la URL
          this.patientService.getPatientsFromApi().subscribe({
            next: (patients) => {
              if (patients && patients.length > 0) {
                // Buscamos el último o el que coincida con el current
                const p = patients.find(patient => (patient as any).id === this.currentPatientId) || patients[patients.length - 1];
                if (p) {
                  this.initializePatientData(p);
                  this.isLoading = false;
                } else {
                  this.isLoading = false;
                  this.errorMessage = 'No se encontró el paciente solicitado.';
                }
              } else {
                this.isLoading = false;
                this.errorMessage = 'No hay pacientes registrados en el sistema.';
              }
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = 'Error de conexión con el servidor.';
            }
          });
        }
      })
    ).subscribe();

    // 3. Suscripción a Notificaciones Reales
    this.notificationService.notifications$.subscribe(notifs => {
      const familyNotifs = notifs.filter(n => n.recipientRole === 'family');
      if (familyNotifs.length > this.notifications.length) {
        const diff = familyNotifs.length - this.notifications.length;
        this.unreadCount += diff;
        const latest: any = familyNotifs[0];
        if (latest && latest.caregiverName) {
          const cgData = {
            fullName: latest.caregiverName,
            specialty: latest.caregiverSpecialty || '-',
            isVerified: latest.caregiverVerified || false
          };

          if (this.patientData) {
            this.patientData.caregiver = cgData;
          } else {
            this.pendingCaregiver = cgData;
          }
        } else if (latest?.relatedPostId) {
          this.syncCaregiverById(latest.relatedPostId);
        }
      }
      this.notifications = familyNotifs;
    });
  }

  fetchPatientData(id: number) {
    this.patientService.getPatientById(id).subscribe({
      next: (data) => {
        this.patientData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar paciente por ID, intentando fallback...', err);
        this.tryFallback(id);
      }
    });
  }

  private tryFallback(requestedId: number) {
    this.patientService.getPatientsFromApi().subscribe({
      next: (patients) => {
        if (patients && patients.length > 0) {
          // Si el ID pedido no existe, mostramos el primero disponible para evitar pantalla en blanco
          const p = patients[0];
          console.log(`⚠️ ID ${requestedId} no encontrado. Mostrando fallback: ${p.id}`);
          this.initializePatientData(p);
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.errorMessage = 'No se encontraron pacientes disponibles.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al intentar recuperar la lista de pacientes.';
      }
    });
  }

  private initializePatientData(data: any) {
    this.patientData = {
      ...data,
      name: data.name || data.patientName,
      age: data.age || data.patientAge,
      insurance: data.healthInsurance || data.insurance,
      location: data.locationLink || data.location,
      medications: (data.medications || []).map((m: any) => ({
        ...m,
        frequency: m.schedule || m.frequency
      })),
      caregiver: this.patientData?.caregiver || this.pendingCaregiver || { fullName: 'Buscando...', specialty: '-', isVerified: false }
    };
    this.checkMatchingForPatient();
  }

  private syncCaregiverById(postId: number) {
    const posts = this.matchingService.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post && post.status === 'Confirmado') {
      this.updateCaregiverInfo(post);
    }
  }

  private checkMatchingForPatient() {
    this.matchingService.posts$.subscribe(posts => {
      if (!this.patientData || !posts) return;

      // Buscamos un servicio que esté 'Confirmado' para este paciente
      // Mejoramos el matching: buscamos coincidencia de nombre o que esté asignado específicamente
      const confirmedService = posts.find(post => {
        const patientName = this.patientData.name || this.patientData.patientName;
        const matchNombre = post.patientName?.trim().toLowerCase() === patientName?.trim().toLowerCase();
        const matchStatus = post.status === 'Confirmado';
        return matchNombre && matchStatus;
      });

      if (confirmedService) {
        this.updateCaregiverInfo(confirmedService);
      }
    });
  }

  private updateCaregiverInfo(service: any) {
    const nombreCuidador = service.caregiverName || 'Cuidador Asignado';

    // Solo actualizamos si el nombre cambió o no estaba asignado
    if (this.patientData && (!this.patientData.caregiver || this.patientData.caregiver.fullName !== nombreCuidador)) {
      this.patientData.caregiver = {
        fullName: nombreCuidador,
        specialty: service.specialty || 'Especialista en Gerontología',
        isVerified: service.status === 'Confirmado'
      };
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.unreadCount = 0;
      // Ya no borramos automáticamente al abrir/cerrar, permitimos que el usuario lo haga explícitamente
    }
  }

  removeNotification(event: Event, id: number) {
    event.stopPropagation(); // Evita que se cierre el dropdown
    this.notificationService.removeNotification(id);
  }

  clearNotifications() {
    this.notificationService.clearByRole('family');
    this.showNotifications = false;
  }

  onEdit() {
    if (this.patientData && this.patientData.id) {
      this.router.navigate(['/family', this.patientData.id]);
    } else {
      this.router.navigate(['/family']);
    }
  }

  onLogout() {
    this.router.navigate(['/login']);
  }

  onCreateNew() {
    this.router.navigate(['/family']);
  }
}
