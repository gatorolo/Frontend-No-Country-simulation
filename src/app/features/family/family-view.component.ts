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
      this.checkMatchingForPatient();
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

      // Si hay más notificaciones de las que teníamos antes, hay algo nuevo
      if (familyNotifs.length > this.notifications.length) {
        const latest: any = familyNotifs[0]; // Tomamos la última

        if (latest && latest.caregiverName) {
          console.log('📢 Nueva notificación: Asignando a', latest.caregiverName);

          // 1. ESTA ES LA LÍNEA CLAVE:
          // Actualizamos la propiedad que el HTML usa en el *ngIf
          if (this.patientData) {
            this.patientData.caregiverName = latest.caregiverName;

            // 2. Opcional: Si también usas el objeto caregiver para el badge
            this.patientData.caregiver = {
              fullName: latest.caregiverName,
              isVerified: true
            };
          }
        }

        // Actualizamos el contador de no leídas
        this.unreadCount += (familyNotifs.length - this.notifications.length);
      }

      this.notifications = familyNotifs;
    });
  }

  fetchPatientData(id: number) {
    this.isLoading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (data) => {
        // 1. Usamos el inicializador (esto arregla el mapeo de campos)
        this.initializePatientData(data);
        this.isLoading = false;

        // 2. Buscamos la orden de Mariano
        this.syncWithActiveOrders();
      },
      error: (err) => {
        console.error('Error al cargar paciente:', err);
        this.tryFallback(id);
      }
    });
  }

  private initializePatientData(data: any) {
    this.patientData = {
      ...data,
      // Aseguramos que 'name' exista para que el .trim() no falle luego
      name: data.name || data.patientName || 'Paciente',
      age: data.age || data.patientAge || '-',
      insurance: data.healthInsurance || data.insurance || '-',
      location: data.locationLink || data.location,
      medications: data.medications || [],
      // Inicializamos caregiverName en null para que el HTML muestre "Buscando..."
      caregiverName: data.caregiverName || null
    };
  }

  private syncWithActiveOrders() {
    this.matchingService.getActiveOrders().subscribe(orders => {
      if (!this.patientData || !orders) return;

      const pName = (this.patientData.name || '').trim().toLowerCase();

      const myOrder = orders.find(order => {
        const oName = (order.patientName || '').trim().toLowerCase();
        // Match: El nombre coincide Y el estado es Confirmado
        return (pName.includes(oName) || oName.includes(pName)) && order.status === 'Confirmado';
      });

      if (myOrder) {
        // Seteamos AMBAS propiedades para que cualquier parte del HTML lo vea
        this.patientData.caregiverName = myOrder.caregiverName;
        this.patientData.caregiver = {
          fullName: myOrder.caregiverName,
          specialty: 'Especialista Asignado',
          isVerified: true
        };
      }
    });
  }
  /*private syncWithActiveOrders() {
    this.matchingService.getActiveOrders().subscribe({
      next: (orders) => {
        console.log('--- BUSCANDO A MARIANO ---');
        console.log('Lista de órdenes recibidas:', orders);

        if (!this.patientData) {
          console.error('❌ Error: this.patientData es null');
          return;
        }

        const pName = (this.patientData.name || '').trim().toLowerCase();
        console.log('Paciente en pantalla:', `"${pName}"`);

        const myOrder = orders.find(order => {
          const pName = (this.patientData.name || '').trim().toLowerCase();
          const oName = (order.patientName || '').trim().toLowerCase();

          // MATCH FLEXIBLE: Si uno contiene al otro (ej: "carlos" está en "carlos almuria")
          const matchesName = pName.includes(oName) || oName.includes(pName);

          // ESTADO: Según tu log, el estado que viene es 'Aprobado' o 'Publicado'
          const isReady = order.status === 'Aprobado' || order.status === 'Publicado' || order.status === 'Confirmado';

          return matchesName && isReady;
        });

        if (myOrder) {
          console.log('✅ ¡LO ENCONTRAMOS!', myOrder.caregiverName);
          this.patientData.caregiverName = myOrder.caregiverName;
          this.patientData.caregiver = { isVerified: true };
        } else {
          console.warn('❌ No hubo coincidencia. Revisa si el nombre o el estado "Confirmado" coinciden.');
        }
      },
      error: (err) => console.error('Error al obtener órdenes:', err)
    });
  }*/

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
